/**
 * Call Executor Module
 * 
 * Handles the execution of payment reminder calls, including pre-call verification,
 * call initiation via LiveKit, outcome tracking, and retry scheduling.
 * 
 * Also provides unified reminder execution that routes to SMS or voice based on channel.
 * 
 * Requirements: 7.1-7.6, 8.1-8.8, 13.1-13.6, 4.1
 */

import { db } from "@/db/drizzle";
import { paymentReminders, invoicesCache, customersCache } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyInvoiceStatus, prepareFreshContext } from "./pre-call-verification";
import { makeCall, CallOutcome } from "./livekit-client";
import { executeSMSReminder, type SMSExecutionResult } from "./sms-executor";
import { cancelPendingReminders } from "./anti-spam";

/**
 * Unified reminder execution result
 */
export type ReminderExecutionResult = 
  | { channel: 'voice'; outcome: CallOutcome }
  | { channel: 'sms'; result: SMSExecutionResult }
  | { channel: 'unknown'; error: string };

/**
 * Execute a reminder based on its channel
 * 
 * This function routes reminder execution to the appropriate handler:
 * - SMS reminders are routed to executeSMSReminder
 * - Voice reminders are routed to executeVoiceReminder (initiateCall)
 * - Unknown channels return an error
 * 
 * Requirement: 4.1
 * 
 * @param reminderId - ID of the reminder to execute
 * @returns Promise resolving to the execution result
 * @throws Error if reminder not found or channel is unknown
 */
export async function executeReminder(
  reminderId: string
): Promise<ReminderExecutionResult> {
  console.log(`[Unified Executor] Executing reminder ${reminderId}`);

  // Fetch reminder to determine channel
  const reminders = await db
    .select()
    .from(paymentReminders)
    .where(eq(paymentReminders.id, reminderId))
    .limit(1);

  if (reminders.length === 0) {
    console.error(`[Unified Executor] Reminder not found: ${reminderId}`);
    throw new Error(`Reminder not found: ${reminderId}`);
  }

  const reminder = reminders[0];
  const channel = reminder.channel || 'voice'; // Default to voice for backwards compatibility

  console.log(`[Unified Executor] Reminder channel: ${channel} (raw value: ${reminder.channel})`);

  // Route based on channel
  if (channel === 'sms') {
    console.log(`[Unified Executor] Routing to SMS executor`);
    const result = await executeSMSReminder(reminderId);
    return { channel: 'sms', result };
  } else if (channel === 'voice') {
    console.log(`[Unified Executor] Routing to voice executor`);
    const outcome = await executeVoiceReminder(reminderId);
    return { channel: 'voice', outcome };
  } else {
    // Unknown channel type
    const error = `Unknown channel type: ${channel}`;
    console.error(`[Unified Executor] ${error}`);
    
    // Mark reminder as failed
    await db
      .update(paymentReminders)
      .set({
        status: 'failed',
        skipReason: error,
        updatedAt: new Date(),
      })
      .where(eq(paymentReminders.id, reminderId));

    return { channel: 'unknown', error };
  }
}

/**
 * Execute a voice reminder (wrapper for initiateCall)
 * 
 * This function provides a consistent interface for voice reminder execution.
 * It calls initiateCall and handleCallOutcome to complete the voice call flow.
 * 
 * @param reminderId - ID of the reminder to execute
 * @returns Promise resolving to the call outcome
 */
export async function executeVoiceReminder(reminderId: string): Promise<CallOutcome> {
  console.log(`[Voice Executor] Executing voice reminder ${reminderId}`);
  
  // Initiate the call
  const outcome = await initiateCall(reminderId);
  
  // Handle the call outcome
  await handleCallOutcome(reminderId, outcome);
  
  return outcome;
}

/**
 * Initiates a call for a payment reminder
 * 
 * This function orchestrates the complete call flow:
 * 1. Verifies invoice status to ensure it's still unpaid
 * 2. Checks if the call should proceed based on verification
 * 3. Prepares fresh context with latest invoice data
 * 4. Makes the call via LiveKit
 * 5. Returns the call outcome
 * 
 * Requirements: 7.1, 7.2, 7.3, 8.1, 8.2
 * 
 * @param reminderId - ID of the reminder to process
 * @returns Promise resolving to the call outcome
 * @throws Error if reminder or invoice not found, or if phone number is missing
 */
export async function initiateCall(reminderId: string): Promise<CallOutcome> {
  console.log(`[Call Executor] Initiating call for reminder ${reminderId}`);
  
  // Fetch reminder from database
  const reminders = await db
    .select()
    .from(paymentReminders)
    .where(eq(paymentReminders.id, reminderId))
    .limit(1);

  if (reminders.length === 0) {
    console.error(`[Call Executor] Reminder not found: ${reminderId}`);
    throw new Error(`Reminder not found: ${reminderId}`);
  }

  const reminder = reminders[0];
  console.log(`[Call Executor] Reminder loaded: type=${reminder.reminderType}, attempt=${reminder.attemptCount}`);

  // Fetch invoice from cache with customer phone
  const invoices = await db
    .select({
      id: invoicesCache.id,
      userId: invoicesCache.userId,
      zohoInvoiceId: invoicesCache.zohoInvoiceId,
      customerId: invoicesCache.customerId,
      customerPhone: customersCache.primaryPhone,
    })
    .from(invoicesCache)
    .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
    .where(eq(invoicesCache.id, reminder.invoiceId))
    .limit(1);

  if (invoices.length === 0) {
    console.error(`[Call Executor] Invoice not found: ${reminder.invoiceId}`);
    throw new Error(`Invoice not found: ${reminder.invoiceId}`);
  }

  const invoice = invoices[0];

  // Validate phone number exists
  if (!invoice.customerPhone) {
    console.error(`[Call Executor] Customer phone number missing for invoice: ${invoice.id}`);
    // Return a specific outcome instead of throwing an error
    return {
      connected: false,
      duration: 0,
      customerResponse: 'no_phone_number',
      notes: 'Customer phone number missing - cannot make call',
    };
  }

  console.log(`[Call Executor] Invoice loaded: ${invoice.zohoInvoiceId}, phone: ${invoice.customerPhone}`);

  // Get organization ID from reminder settings or invoice
  const organizationId = await getOrganizationId(reminder.userId);

  // Step 1: Verify invoice status (Requirement 7.1)
  console.log(`[Call Executor] Verifying invoice status for ${invoice.zohoInvoiceId}...`);
  const verification = await verifyInvoiceStatus(
    reminder.userId,
    invoice.id,
    invoice.zohoInvoiceId,
    organizationId
  );

  console.log(`[Call Executor] Verification result: isPaid=${verification.isPaid}, shouldProceed=${verification.shouldProceed}`);

  // Step 2: Check if should proceed (Requirements 7.2, 7.3)
  if (!verification.shouldProceed) {
    // Invoice is paid or verification failed - return outcome indicating skip
    console.log(`[Call Executor] Skipping call: ${verification.isPaid ? 'Invoice is paid' : 'Verification failed'}`);
    return {
      connected: false,
      duration: 0,
      customerResponse: 'already_paid',
      notes: `Pre-call verification: ${verification.isPaid ? 'Invoice is paid' : 'Verification failed'}`,
    };
  }

  // Step 3: Prepare fresh context (Requirement 7.6, 8.2)
  console.log(`[Call Executor] Preparing call context...`);
  const context = await prepareFreshContext(invoice.id, reminder.userId);
  
  // Add reminder_id to context for webhook integration
  context.reminderId = reminderId;

  // Get user language and voice preferences
  const { reminderSettings } = await import("@/db/schema");
  const userSettings = await db
    .select({
      language: reminderSettings.language,
      voiceGender: reminderSettings.voiceGender,
    })
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, reminder.userId))
    .limit(1);

  // Add language and voice preferences to context
  if (userSettings.length > 0) {
    context.language = userSettings[0].language;
    context.voiceGender = userSettings[0].voiceGender;
    console.log(`[Call Executor] Using language: ${context.language}, voice: ${context.voiceGender}`);
  } else {
    // Default values
    context.language = 'en';
    context.voiceGender = 'female';
    console.log(`[Call Executor] Using default language: ${context.language}, voice: ${context.voiceGender}`);
  }

  // Step 4: Make call via LiveKit (Requirements 8.1, 8.2)
  console.log(`[Call Executor] Making call to ${invoice.customerPhone}...`);
  const callStartTime = Date.now();
  const outcome = await makeCall(invoice.customerPhone, context);
  const callDuration = Date.now() - callStartTime;

  console.log(`[Call Executor] Call completed in ${callDuration}ms: connected=${outcome.connected}, response=${outcome.customerResponse}`);

  // Step 5: Return call outcome
  return outcome;
}

/**
 * Handles the outcome of a call attempt
 * 
 * This function processes the call outcome and updates the reminder accordingly:
 * 1. Updates reminder status based on outcome
 * 2. Records call outcome data
 * 3. Handles customer responses (will_pay_today, already_paid, dispute, no_answer)
 * 4. Triggers immediate verification if customer says already_paid
 * 5. Cancels future reminders if invoice is paid
 * 
 * Requirements: 8.3, 8.4, 8.5, 8.6
 * 
 * @param reminderId - ID of the reminder
 * @param outcome - Call outcome from LiveKit
 * @returns Promise that resolves when outcome is handled
 */
export async function handleCallOutcome(
  reminderId: string,
  outcome: CallOutcome
): Promise<void> {
  console.log(`[Call Executor] Handling call outcome for reminder ${reminderId}:`, {
    connected: outcome.connected,
    duration: outcome.duration,
    customerResponse: outcome.customerResponse,
  });
  
  // Fetch reminder to get invoice and user info
  const reminders = await db
    .select()
    .from(paymentReminders)
    .where(eq(paymentReminders.id, reminderId))
    .limit(1);

  if (reminders.length === 0) {
    console.error(`[Call Executor] Reminder not found: ${reminderId}`);
    throw new Error(`Reminder not found: ${reminderId}`);
  }

  const reminder = reminders[0];

  // Determine new status based on outcome (Requirement 8.3)
  let newStatus = 'completed';
  let skipReason: string | null = null;

  if (!outcome.connected) {
    if (outcome.customerResponse === 'no_phone_number') {
      // No phone number - skip this reminder permanently
      newStatus = 'skipped';
      skipReason = 'Customer phone number missing';
      console.log(`[Call Executor] No phone number available, skipping reminder permanently`);
    } else {
      // Call failed to connect - will need retry
      newStatus = 'pending';
      console.log(`[Call Executor] Call failed to connect, marking for retry`);
    }
  } else if (outcome.customerResponse === 'already_paid') {
    // Customer claims already paid - verify and potentially skip
    newStatus = 'skipped';
    skipReason = 'Customer reported payment already made';
    console.log(`[Call Executor] Customer reported payment already made, triggering verification`);
    
    // Trigger immediate verification (Requirement 8.6)
    await verifyAndCancelIfPaid(reminder.invoiceId, reminder.userId);
  } else if (outcome.customerResponse === 'no_answer') {
    // No answer - will need retry
    newStatus = 'pending';
    console.log(`[Call Executor] No answer, marking for retry`);
  } else {
    // Call completed successfully (will_pay_today, dispute, other)
    newStatus = 'completed';
    console.log(`[Call Executor] Call completed successfully with response: ${outcome.customerResponse}`);
  }

  // Update reminder with outcome (Requirements 8.4, 8.5)
  console.log(`[Call Executor] Updating reminder status to: ${newStatus}`);
  await db
    .update(paymentReminders)
    .set({
      status: newStatus,
      callOutcome: JSON.stringify(outcome),
      skipReason,
      lastAttemptAt: new Date(),
      attemptCount: reminder.attemptCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(paymentReminders.id, reminderId));
  
  console.log(`[Call Executor] Reminder updated: attempt count now ${reminder.attemptCount + 1}`);
}

/**
 * Schedules a retry for a failed reminder attempt (SMS or voice)
 * 
 * This function:
 * 1. Checks if retry attempts remaining
 * 2. Calculates next retry time based on delay hours
 * 3. Updates reminder for retry or marks as failed if max attempts reached
 * 4. Preserves the original channel (doesn't switch SMS to voice or vice versa)
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.6, 8.7, 8.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 * 
 * @param reminderId - ID of the reminder to retry
 * @returns Promise that resolves when retry is scheduled
 */
export async function scheduleRetry(reminderId: string): Promise<void> {
  console.log(`[Retry Scheduler] Scheduling retry for reminder ${reminderId}`);
  
  // Fetch reminder
  const reminders = await db
    .select()
    .from(paymentReminders)
    .where(eq(paymentReminders.id, reminderId))
    .limit(1);

  if (reminders.length === 0) {
    console.error(`[Retry Scheduler] Reminder not found: ${reminderId}`);
    throw new Error(`Reminder not found: ${reminderId}`);
  }

  const reminder = reminders[0];
  const channel = reminder.channel || 'voice';

  console.log(`[Retry Scheduler] Reminder channel: ${channel}, current attempt: ${reminder.attemptCount}`);

  // Get user settings to check max retry attempts and delay
  const { reminderSettings } = await import("@/db/schema");
  
  const settings = await db
    .select()
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, reminder.userId))
    .limit(1);

  if (settings.length === 0) {
    console.error(`[Retry Scheduler] Settings not found for user: ${reminder.userId}`);
    throw new Error(`Settings not found for user: ${reminder.userId}`);
  }

  const userSettings = settings[0];
  const maxRetryAttempts = userSettings.maxRetryAttempts;
  const retryDelayHours = userSettings.retryDelayHours;

  console.log(`[Retry Scheduler] Max attempts: ${maxRetryAttempts}, retry delay: ${retryDelayHours} hours`);

  // Check if retry attempts remaining (Requirements 7.3, 8.7, 13.4)
  if (reminder.attemptCount >= maxRetryAttempts) {
    // Max attempts reached - mark as permanently failed (Requirement 7.3)
    console.log(`[Retry Scheduler] Max retry attempts reached (${maxRetryAttempts}), marking as permanently failed`);
    await db
      .update(paymentReminders)
      .set({
        status: 'failed',
        skipReason: `Maximum retry attempts (${maxRetryAttempts}) exceeded for ${channel} channel`,
        updatedAt: new Date(),
      })
      .where(eq(paymentReminders.id, reminderId));
    
    console.error(`[Retry Scheduler] Reminder ${reminderId} marked as failed after ${maxRetryAttempts} attempts on ${channel} channel`);
    return;
  }

  // Calculate next retry time (Requirements 7.1, 8.8, 13.3)
  // Default to 2 hours if retryDelayHours is not set
  const delayHours = retryDelayHours || 2;
  const now = new Date();
  const nextRetryTime = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

  console.log(`[Retry Scheduler] Scheduling retry for ${nextRetryTime.toISOString()} (${delayHours} hours from now)`);
  console.log(`[Retry Scheduler] Channel will remain: ${channel} (Requirement 7.4)`);

  // Update reminder for retry (Requirements 7.2, 7.4, 7.5, 13.2, 13.5, 13.6)
  // Note: We do NOT update the channel field - it stays the same (Requirement 7.4)
  await db
    .update(paymentReminders)
    .set({
      scheduledDate: nextRetryTime,
      status: 'pending',
      updatedAt: new Date(),
      // channel is NOT updated - preserves original channel (Requirement 7.4)
    })
    .where(eq(paymentReminders.id, reminderId));
  
  console.log(`[Retry Scheduler] Retry scheduled successfully for reminder ${reminderId} on ${channel} channel`);
}

/**
 * Verifies invoice status and cancels future reminders if paid
 * 
 * @param invoiceId - Invoice ID
 * @param userId - User ID
 */
async function verifyAndCancelIfPaid(
  invoiceId: string,
  userId: string
): Promise<void> {
  console.log(`[Call Executor] Verifying invoice ${invoiceId} payment status...`);
  
  // Fetch invoice details
  const invoices = await db
    .select({
      id: invoicesCache.id,
      zohoInvoiceId: invoicesCache.zohoInvoiceId,
    })
    .from(invoicesCache)
    .where(eq(invoicesCache.id, invoiceId))
    .limit(1);

  if (invoices.length === 0) {
    console.error(`[Call Executor] Invoice not found for verification: ${invoiceId}`);
    return;
  }

  const invoice = invoices[0];
  const organizationId = await getOrganizationId(userId);

  // Verify current status
  const verification = await verifyInvoiceStatus(
    userId,
    invoice.id,
    invoice.zohoInvoiceId,
    organizationId
  );

  console.log(`[Call Executor] Verification complete: isPaid=${verification.isPaid}`);

  // If invoice is paid, cancel all pending reminders (Requirement 7.5, 10.4)
  if (verification.isPaid) {
    console.log(`[Call Executor] Invoice ${invoiceId} is paid, cancelling all pending reminders`);
    const cancelledCount = await cancelPendingReminders(invoiceId);
    console.log(`[Call Executor] Cancelled ${cancelledCount} pending reminders for invoice ${invoiceId}`);
  }
}

/**
 * Helper function to get organization ID for a user
 * 
 * @param userId - User ID
 * @returns Organization ID
 */
async function getOrganizationId(userId: string): Promise<string> {
  // Query reminder settings to get organization ID
  const { reminderSettings } = await import("@/db/schema");
  
  const settings = await db
    .select()
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, userId))
    .limit(1);

  if (settings.length === 0 || !settings[0].organizationId) {
    throw new Error(`Organization ID not found for user: ${userId}`);
  }

  return settings[0].organizationId;
}
