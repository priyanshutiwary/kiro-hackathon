/**
 * SMS Executor Module
 * 
 * Handles the execution of SMS payment reminders via Twilio.
 * This module fetches invoice and customer data, formats SMS messages,
 * sends them via Twilio, tracks delivery status, and schedules retries on failure.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { db } from "@/db/drizzle";
import { 
  paymentReminders, 
  invoicesCache, 
  customersCache, 
  businessProfiles 
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
  getTwilioClient, 
  TwilioRateLimitError, 
  TwilioAPIError 
} from "./twilio-client";
import { formatSMSMessage, type SMSMessageData } from "./sms-formatter";

/**
 * Result of an SMS reminder execution
 */
export interface SMSExecutionResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Mask phone number for logging (PII protection)
 * Shows only last 4 digits: +1234567890 -> +******7890
 */
function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length <= 4) {
    return '****';
  }
  const lastFour = phoneNumber.slice(-4);
  return `+******${lastFour}`;
}

/**
 * Sanitize phone number to E.164 format
 * Removes dashes, spaces, parentheses, and other non-digit characters
 * Keeps the leading + sign
 * 
 * Examples:
 * - "+91-6202390324" -> "+916202390324"
 * - "+1 (555) 123-4567" -> "+15551234567"
 * - "+44 20 7946 0958" -> "+442079460958"
 */
function sanitizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) {
    return '';
  }
  
  // Keep only + and digits
  const sanitized = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!sanitized.startsWith('+')) {
    return `+${sanitized}`;
  }
  
  return sanitized;
}

/**
 * Determine if an error should trigger a retry
 * Invalid phone numbers and certain Twilio errors should not retry
 */
function shouldRetryError(error: string): boolean {
  const noRetryPrefixes = [
    'INVALID_PHONE_NUMBER',
    'Customer phone number missing',
  ];
  
  return !noRetryPrefixes.some(prefix => error.startsWith(prefix));
}

/**
 * Execute an SMS reminder
 * 
 * This function orchestrates the complete SMS sending flow:
 * 1. Updates reminder status to 'in_progress'
 * 2. Fetches invoice, customer, and business profile data
 * 3. Formats the SMS message
 * 4. Sends SMS via Twilio
 * 5. Stores Twilio message SID in externalId on success
 * 6. Marks as 'pending' and schedules retry on failure
 * 7. Updates lastAttemptAt and attemptCount
 * 8. Increments attemptCount on each attempt
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * @param reminderId - ID of the reminder to execute
 * @returns Promise resolving to execution result
 * @throws Error if reminder, invoice, customer, or business profile not found
 */
export async function executeSMSReminder(
  reminderId: string
): Promise<SMSExecutionResult> {
  console.log(`[SMS Executor] Executing SMS reminder ${reminderId}`);

  // Step 1: Update status to in_progress (Requirement 4.1)
  await db
    .update(paymentReminders)
    .set({
      status: 'in_progress',
      updatedAt: new Date(),
    })
    .where(eq(paymentReminders.id, reminderId));

  console.log(`[SMS Executor] Reminder status updated to in_progress`);

  try {
    // Step 2: Fetch reminder from database
    const reminders = await db
      .select()
      .from(paymentReminders)
      .where(eq(paymentReminders.id, reminderId))
      .limit(1);

    if (reminders.length === 0) {
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    const reminder = reminders[0];
    console.log(`[SMS Executor] Reminder loaded: type=${reminder.reminderType}, attempt=${reminder.attemptCount}`);

    // Step 3: Fetch invoice data (Requirement 4.2)
    const invoices = await db
      .select()
      .from(invoicesCache)
      .where(eq(invoicesCache.id, reminder.invoiceId))
      .limit(1);

    if (invoices.length === 0) {
      throw new Error(`Invoice not found: ${reminder.invoiceId}`);
    }

    const invoice = invoices[0];
    console.log(`[SMS Executor] Invoice loaded: ${invoice.invoiceNumber}, amount due: ${invoice.amountDue}`);

    // Step 4: Fetch customer data (Requirement 4.2)
    if (!invoice.customerId) {
      throw new Error(`Customer ID missing for invoice: ${invoice.id}`);
    }

    const customers = await db
      .select()
      .from(customersCache)
      .where(eq(customersCache.id, invoice.customerId))
      .limit(1);

    if (customers.length === 0) {
      throw new Error(`Customer not found: ${invoice.customerId}`);
    }

    const customer = customers[0];
    const maskedPhone = maskPhoneNumber(customer.primaryPhone || '');
    console.log(`[SMS Executor] Customer loaded: ${customer.customerName}, phone: ${maskedPhone}`);

    // Validate phone number exists (invalid phone = don't retry)
    if (!customer.primaryPhone) {
      const error = 'Customer phone number missing';
      console.error(`[SMS Executor] ${error} - marking as permanent failure (no retry)`);
      
      // Mark as failed - don't retry (Requirement 4.5)
      await db
        .update(paymentReminders)
        .set({
          status: 'failed',
          skipReason: error,
          lastAttemptAt: new Date(),
          attemptCount: reminder.attemptCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(paymentReminders.id, reminderId));

      return {
        success: false,
        error,
      };
    }

    // Step 5: Fetch business profile data (Requirement 4.3)
    const profiles = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, reminder.userId))
      .limit(1);

    if (profiles.length === 0) {
      throw new Error(`Business profile not found for user: ${reminder.userId}`);
    }

    const businessProfile = profiles[0];
    console.log(`[SMS Executor] Business profile loaded: ${businessProfile.companyName}`);

    // Step 6: Format SMS message (Requirement 4.2, 4.3)
    const messageData: SMSMessageData = {
      customerName: customer.customerName,
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      amount: invoice.amountDue || '0',
      currencyCode: invoice.currencyCode,
      dueDate: invoice.dueDate,
      companyName: businessProfile.companyName,
    };

    const message = formatSMSMessage(messageData);
    console.log(`[SMS Executor] SMS message formatted (${message.length} chars)`);

    // Step 7: Send SMS via Twilio (Requirement 4.1)
    const twilioClient = getTwilioClient();
    
    if (!twilioClient) {
      const error = 'Twilio client not configured';
      console.error(`[SMS Executor] ${error} - scheduling retry`);
      
      // Mark as pending and schedule retry (Requirements 7.1-7.5)
      await db
        .update(paymentReminders)
        .set({
          status: 'pending',
          skipReason: error,
          lastAttemptAt: new Date(),
          attemptCount: reminder.attemptCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(paymentReminders.id, reminderId));

      // Schedule retry
      const { scheduleRetry } = await import("./call-executor");
      await scheduleRetry(reminderId);

      return {
        success: false,
        error,
      };
    }

    console.log(`[SMS Executor] Sending SMS to ${maskedPhone}...`);
    
    // Sanitize phone number to E.164 format (remove dashes, spaces, etc.)
    const sanitizedPhone = sanitizePhoneNumber(customer.primaryPhone);
    console.log(`[SMS Executor] Phone sanitized: ${maskPhoneNumber(sanitizedPhone)}`);
    
    try {
      const result = await twilioClient.sendSMS(sanitizedPhone, message);

      // Step 8: Update reminder based on result
      if (result.success && result.messageSid) {
        // Success: Store Twilio message SID in externalId (Requirement 4.4)
        console.log(`[SMS Executor] SMS sent successfully. Message SID: ${result.messageSid}`);
        
        await db
          .update(paymentReminders)
          .set({
            status: 'completed', // Will be updated by webhook if delivery fails
            externalId: result.messageSid,
            lastAttemptAt: new Date(),
            attemptCount: reminder.attemptCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(paymentReminders.id, reminderId));

        return {
          success: true,
          messageSid: result.messageSid,
        };
      } else {
        // Failure: Determine if we should retry
        const error = result.error || 'Unknown error';
        const shouldRetry = shouldRetryError(error);
        
        if (shouldRetry) {
          console.error(`[SMS Executor] SMS sending failed (will retry): ${error}`);
          
          // Mark as pending and schedule retry (Requirements 7.1-7.5)
          await db
            .update(paymentReminders)
            .set({
              status: 'pending',
              skipReason: error,
              lastAttemptAt: new Date(),
              attemptCount: reminder.attemptCount + 1,
              updatedAt: new Date(),
            })
            .where(eq(paymentReminders.id, reminderId));

          // Schedule retry (Requirements 7.1-7.5)
          const { scheduleRetry } = await import("./call-executor");
          await scheduleRetry(reminderId);
        } else {
          console.error(`[SMS Executor] SMS sending failed (no retry): ${error}`);
          
          // Mark as permanently failed - don't retry
          await db
            .update(paymentReminders)
            .set({
              status: 'failed',
              skipReason: error,
              lastAttemptAt: new Date(),
              attemptCount: reminder.attemptCount + 1,
              updatedAt: new Date(),
            })
            .where(eq(paymentReminders.id, reminderId));
        }

        return {
          success: false,
          error,
        };
      }
    } catch (twilioError) {
      // Handle Twilio-specific errors
      if (twilioError instanceof TwilioRateLimitError) {
        // Rate limiting: wait and retry after delay
        const error = `Rate limit exceeded. Retry after ${twilioError.retryAfter || 60} seconds`;
        console.warn(`[SMS Executor] ${error} - scheduling retry with backoff`);
        
        await db
          .update(paymentReminders)
          .set({
            status: 'pending',
            skipReason: error,
            lastAttemptAt: new Date(),
            attemptCount: reminder.attemptCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(paymentReminders.id, reminderId));

        // Schedule retry with exponential backoff
        const { scheduleRetry } = await import("./call-executor");
        await scheduleRetry(reminderId);

        return {
          success: false,
          error,
        };
      } else if (twilioError instanceof TwilioAPIError) {
        // Twilio API error: mark as failed, schedule retry
        const error = `Twilio API error: ${twilioError.message}`;
        console.error(`[SMS Executor] ${error} - scheduling retry`);
        
        await db
          .update(paymentReminders)
          .set({
            status: 'pending',
            skipReason: error,
            lastAttemptAt: new Date(),
            attemptCount: reminder.attemptCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(paymentReminders.id, reminderId));

        // Schedule retry
        const { scheduleRetry } = await import("./call-executor");
        await scheduleRetry(reminderId);

        return {
          success: false,
          error,
        };
      }
      
      // Re-throw unexpected errors
      throw twilioError;
    }
  } catch (error) {
    // Handle unexpected errors (Requirement 4.5)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SMS Executor] Unexpected error:`, error);

    // Fetch reminder again to get current attemptCount
    const reminders = await db
      .select()
      .from(paymentReminders)
      .where(eq(paymentReminders.id, reminderId))
      .limit(1);

    const attemptCount = reminders.length > 0 ? reminders[0].attemptCount : 0;

    // Network errors: schedule retry with exponential backoff (Requirement 4.5)
    await db
      .update(paymentReminders)
      .set({
        status: 'pending',
        skipReason: errorMessage,
        lastAttemptAt: new Date(),
        attemptCount: attemptCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(paymentReminders.id, reminderId));

    // Schedule retry (Requirements 7.1-7.5)
    try {
      const { scheduleRetry } = await import("./call-executor");
      await scheduleRetry(reminderId);
    } catch (retryError) {
      console.error(`[SMS Executor] Failed to schedule retry:`, retryError);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
