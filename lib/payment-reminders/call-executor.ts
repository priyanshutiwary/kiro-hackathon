/**
 * Call Executor Module
 * 
 * Handles the execution of payment reminder calls, including pre-call verification,
 * call initiation via LiveKit, outcome tracking, and retry scheduling.
 * 
 * Requirements: 7.1-7.6, 8.1-8.8, 13.1-13.6
 */

import { db } from "@/db/drizzle";
import { paymentReminders, invoicesCache } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyInvoiceStatus, prepareFreshContext } from "./pre-call-verification";
import { makeCall, CallOutcome } from "./livekit-client";

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

  // Fetch invoice from cache
  const invoices = await db
    .select({
      id: invoicesCache.id,
      userId: invoicesCache.userId,
      zohoInvoiceId: invoicesCache.zohoInvoiceId,
      customerPhone: invoicesCache.customerPhone,
    })
    .from(invoicesCache)
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
    throw new Error(`Customer phone number missing for invoice: ${invoice.id}`);
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
    // Call failed to connect - will need retry
    newStatus = 'pending';
    console.log(`[Call Executor] Call failed to connect, marking for retry`);
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
 * Schedules a retry for a failed call attempt
 * 
 * This function:
 * 1. Checks if retry attempts remaining
 * 2. Calculates next retry time based on delay hours
 * 3. Updates reminder for retry or marks as failed if max attempts reached
 * 
 * Requirements: 8.6, 8.7, 8.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 * 
 * @param reminderId - ID of the reminder to retry
 * @returns Promise that resolves when retry is scheduled
 */
export async function scheduleRetry(reminderId: string): Promise<void> {
  console.log(`[Call Executor] Scheduling retry for reminder ${reminderId}`);
  
  // Fetch reminder
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

  // Get user settings to check max retry attempts and delay
  const { reminderSettings } = await import("@/db/schema");
  
  const settings = await db
    .select()
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, reminder.userId))
    .limit(1);

  if (settings.length === 0) {
    console.error(`[Call Executor] Settings not found for user: ${reminder.userId}`);
    throw new Error(`Settings not found for user: ${reminder.userId}`);
  }

  const userSettings = settings[0];
  const maxRetryAttempts = userSettings.maxRetryAttempts;
  const retryDelayHours = userSettings.retryDelayHours;

  console.log(`[Call Executor] Current attempt: ${reminder.attemptCount}, max attempts: ${maxRetryAttempts}`);

  // Check if retry attempts remaining (Requirements 8.7, 13.4)
  if (reminder.attemptCount >= maxRetryAttempts) {
    // Max attempts reached - mark as failed (Requirement 13.4)
    console.log(`[Call Executor] Max retry attempts reached (${maxRetryAttempts}), marking as failed`);
    await db
      .update(paymentReminders)
      .set({
        status: 'failed',
        skipReason: `Maximum retry attempts (${maxRetryAttempts}) exceeded`,
        updatedAt: new Date(),
      })
      .where(eq(paymentReminders.id, reminderId));
    
    console.error(`[Call Executor] Reminder ${reminderId} marked as failed after ${maxRetryAttempts} attempts`);
    return;
  }

  // Calculate next retry time (Requirements 8.8, 13.3)
  const now = new Date();
  const nextRetryTime = new Date(now.getTime() + retryDelayHours * 60 * 60 * 1000);

  console.log(`[Call Executor] Scheduling retry for ${nextRetryTime.toISOString()} (${retryDelayHours} hours from now)`);

  // Update reminder for retry (Requirements 13.2, 13.5, 13.6)
  await db
    .update(paymentReminders)
    .set({
      scheduledDate: nextRetryTime,
      status: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(paymentReminders.id, reminderId));
  
  console.log(`[Call Executor] Retry scheduled successfully for reminder ${reminderId}`);
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

  // If invoice is paid, cancel all pending reminders (Requirement 7.5)
  if (verification.isPaid) {
    console.log(`[Call Executor] Invoice ${invoiceId} is paid, cancelling all pending reminders`);
    await db
      .update(paymentReminders)
      .set({
        status: 'skipped',
        skipReason: 'Invoice verified as paid',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(paymentReminders.invoiceId, invoiceId),
          eq(paymentReminders.status, 'pending')
        )
      );
    console.log(`[Call Executor] All pending reminders cancelled for invoice ${invoiceId}`);
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
