/**
 * Anti-Spam Protection Module
 * 
 * Provides functions to prevent spamming customers with reminders:
 * - Duplicate prevention (only one reminder per scheduled date)
 * - Prevent SMS and voice on same day for same invoice
 * - Business hours enforcement
 * - Cancel pending reminders when invoice is paid
 * - Respect minimum retry delay and max attempts
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { db } from "@/db/drizzle";
import { paymentReminders } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { ReminderSettings } from "./settings-manager";

/**
 * Check if a reminder already exists for the same invoice on the same date
 * 
 * This prevents duplicate reminders from being created for the same invoice
 * on the same scheduled date, regardless of channel.
 * 
 * Requirement: 10.1
 * 
 * @param invoiceId - Invoice ID
 * @param scheduledDate - Scheduled date for the reminder
 * @returns Promise resolving to true if duplicate exists, false otherwise
 */
export async function hasDuplicateReminder(
  invoiceId: string,
  scheduledDate: Date
): Promise<boolean> {
  console.log(`[Anti-Spam] Checking for duplicate reminder for invoice ${invoiceId} on ${scheduledDate.toISOString()}`);
  
  // Normalize date to start of day for comparison
  const startOfDay = new Date(scheduledDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(scheduledDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Check if any reminder exists for this invoice on this date
  const existingReminders = await db
    .select()
    .from(paymentReminders)
    .where(
      and(
        eq(paymentReminders.invoiceId, invoiceId),
        gte(paymentReminders.scheduledDate, startOfDay),
        lte(paymentReminders.scheduledDate, endOfDay)
      )
    )
    .limit(1);
  
  const hasDuplicate = existingReminders.length > 0;
  
  if (hasDuplicate) {
    console.log(`[Anti-Spam] Duplicate reminder found for invoice ${invoiceId} on ${scheduledDate.toISOString()}`);
  }
  
  return hasDuplicate;
}

/**
 * Check if both SMS and voice reminders exist for the same invoice on the same day
 * 
 * This prevents sending both SMS and voice reminders on the same day for the same invoice.
 * 
 * Requirement: 10.1
 * 
 * @param invoiceId - Invoice ID
 * @param scheduledDate - Scheduled date for the reminder
 * @param proposedChannel - Channel for the new reminder ('sms' or 'voice')
 * @returns Promise resolving to true if opposite channel already exists, false otherwise
 */
export async function hasOppositeChannelOnSameDay(
  invoiceId: string,
  scheduledDate: Date,
  proposedChannel: 'sms' | 'voice'
): Promise<boolean> {
  console.log(`[Anti-Spam] Checking for opposite channel reminder for invoice ${invoiceId} on ${scheduledDate.toISOString()}`);
  
  // Normalize date to start of day for comparison
  const startOfDay = new Date(scheduledDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(scheduledDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Determine opposite channel
  const oppositeChannel = proposedChannel === 'sms' ? 'voice' : 'sms';
  
  // Check if opposite channel reminder exists for this invoice on this date
  const existingReminders = await db
    .select()
    .from(paymentReminders)
    .where(
      and(
        eq(paymentReminders.invoiceId, invoiceId),
        eq(paymentReminders.channel, oppositeChannel),
        gte(paymentReminders.scheduledDate, startOfDay),
        lte(paymentReminders.scheduledDate, endOfDay)
      )
    )
    .limit(1);
  
  const hasOpposite = existingReminders.length > 0;
  
  if (hasOpposite) {
    console.log(`[Anti-Spam] Opposite channel (${oppositeChannel}) reminder found for invoice ${invoiceId} on ${scheduledDate.toISOString()}`);
  }
  
  return hasOpposite;
}

/**
 * Check if current time is within business hours
 * 
 * This enforces business hours from reminder settings to prevent
 * sending reminders outside configured hours.
 * 
 * Requirement: 10.5
 * 
 * @param settings - User reminder settings
 * @returns Object with canSend flag and reason if cannot send
 */
export function isWithinBusinessHours(
  settings: ReminderSettings
): { canSend: boolean; reason?: string } {
  console.log(`[Anti-Spam] Checking business hours`);
  
  // Get current time in user's timezone
  const now = new Date();
  const userTimezone = settings.callTimezone || 'UTC';
  
  // Convert current time to user's timezone
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  
  // Get current day of week (0 = Sunday, 6 = Saturday)
  const currentDay = userTime.getDay();
  
  // Check if current day is in allowed days
  const allowedDays = settings.callDaysOfWeek || [1, 2, 3, 4, 5]; // Default to weekdays
  
  if (!allowedDays.includes(currentDay)) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const reason = `Current day (${dayNames[currentDay]}) is not in allowed days`;
    console.log(`[Anti-Spam] ${reason}`);
    return { canSend: false, reason };
  }
  
  // Get current time in HH:MM:SS format
  const currentTime = userTime.toTimeString().split(' ')[0]; // "HH:MM:SS"
  
  // Get allowed time range
  const startTime = settings.callStartTime || '09:00:00';
  const endTime = settings.callEndTime || '18:00:00';
  
  // Compare times
  if (currentTime < startTime || currentTime > endTime) {
    const reason = `Current time (${currentTime}) is outside business hours (${startTime} - ${endTime})`;
    console.log(`[Anti-Spam] ${reason}`);
    return { canSend: false, reason };
  }
  
  console.log(`[Anti-Spam] Within business hours: ${currentTime} is between ${startTime} and ${endTime}`);
  return { canSend: true };
}

/**
 * Check if minimum retry delay has been respected
 * 
 * This ensures that retries are not scheduled too quickly after a failed attempt.
 * 
 * Requirement: 10.2
 * 
 * @param lastAttemptAt - Timestamp of last attempt
 * @param retryDelayHours - Minimum delay in hours between retries
 * @returns Object with canRetry flag and reason if cannot retry
 */
export function canRetryNow(
  lastAttemptAt: Date | null,
  retryDelayHours: number
): { canRetry: boolean; reason?: string; nextRetryTime?: Date } {
  console.log(`[Anti-Spam] Checking retry delay`);
  
  if (!lastAttemptAt) {
    // No previous attempt, can retry
    return { canRetry: true };
  }
  
  const now = new Date();
  const minRetryTime = new Date(lastAttemptAt.getTime() + retryDelayHours * 60 * 60 * 1000);
  
  if (now < minRetryTime) {
    const reason = `Minimum retry delay (${retryDelayHours} hours) not met. Last attempt: ${lastAttemptAt.toISOString()}`;
    console.log(`[Anti-Spam] ${reason}`);
    return { 
      canRetry: false, 
      reason,
      nextRetryTime: minRetryTime
    };
  }
  
  console.log(`[Anti-Spam] Retry delay satisfied: ${retryDelayHours} hours have passed since last attempt`);
  return { canRetry: true };
}

/**
 * Check if max retry attempts have been exceeded
 * 
 * This prevents infinite retry loops by enforcing a maximum number of attempts.
 * 
 * Requirement: 10.3
 * 
 * @param attemptCount - Current number of attempts
 * @param maxRetryAttempts - Maximum allowed attempts
 * @returns Object with canRetry flag and reason if cannot retry
 */
export function hasAttemptsRemaining(
  attemptCount: number,
  maxRetryAttempts: number
): { canRetry: boolean; reason?: string } {
  console.log(`[Anti-Spam] Checking retry attempts: ${attemptCount}/${maxRetryAttempts}`);
  
  if (attemptCount >= maxRetryAttempts) {
    const reason = `Maximum retry attempts (${maxRetryAttempts}) exceeded. Current attempts: ${attemptCount}`;
    console.log(`[Anti-Spam] ${reason}`);
    return { canRetry: false, reason };
  }
  
  console.log(`[Anti-Spam] Attempts remaining: ${maxRetryAttempts - attemptCount}`);
  return { canRetry: true };
}

/**
 * Cancel all pending reminders for a paid invoice
 * 
 * This prevents sending reminders for invoices that have been paid.
 * 
 * Requirement: 10.4
 * 
 * @param invoiceId - Invoice ID
 * @returns Promise resolving to number of reminders cancelled
 */
export async function cancelPendingReminders(
  invoiceId: string
): Promise<number> {
  console.log(`[Anti-Spam] Cancelling all pending reminders for invoice ${invoiceId}`);
  
  // Update all pending reminders to skipped status
  // Store result to ensure the promise is awaited and errors are caught
  const _updateResult = await db
    .update(paymentReminders)
    .set({
      status: 'skipped',
      skipReason: 'Invoice marked as paid',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(paymentReminders.invoiceId, invoiceId),
        eq(paymentReminders.status, 'pending')
      )
    );
  
  // Note: Drizzle doesn't return affected rows count directly
  // We'll query to count how many were updated
  const cancelledReminders = await db
    .select()
    .from(paymentReminders)
    .where(
      and(
        eq(paymentReminders.invoiceId, invoiceId),
        eq(paymentReminders.status, 'skipped'),
        eq(paymentReminders.skipReason, 'Invoice marked as paid')
      )
    );
  
  const count = cancelledReminders.length;
  console.log(`[Anti-Spam] Cancelled ${count} pending reminders for invoice ${invoiceId}`);
  
  return count;
}

/**
 * Comprehensive anti-spam check before sending a reminder
 * 
 * This function performs all anti-spam checks in one call:
 * - Business hours enforcement
 * - Retry delay enforcement
 * - Max attempts enforcement
 * 
 * Requirement: 10.1, 10.2, 10.3, 10.5
 * 
 * @param reminder - Reminder object
 * @param settings - User reminder settings
 * @returns Object with canSend flag and reason if cannot send
 */
export function canSendReminder(
  reminder: {
    attemptCount: number;
    lastAttemptAt: Date | null;
  },
  settings: ReminderSettings
): { canSend: boolean; reason?: string; nextAvailableTime?: Date } {
  console.log(`[Anti-Spam] Performing comprehensive anti-spam check`);
  
  // Check business hours
  const businessHoursCheck = isWithinBusinessHours(settings);
  if (!businessHoursCheck.canSend) {
    return { 
      canSend: false, 
      reason: businessHoursCheck.reason 
    };
  }
  
  // Check retry delay
  const retryDelayCheck = canRetryNow(
    reminder.lastAttemptAt,
    settings.retryDelayHours
  );
  if (!retryDelayCheck.canRetry) {
    return { 
      canSend: false, 
      reason: retryDelayCheck.reason,
      nextAvailableTime: retryDelayCheck.nextRetryTime
    };
  }
  
  // Check max attempts
  const attemptsCheck = hasAttemptsRemaining(
    reminder.attemptCount,
    settings.maxRetryAttempts
  );
  if (!attemptsCheck.canRetry) {
    return { 
      canSend: false, 
      reason: attemptsCheck.reason 
    };
  }
  
  console.log(`[Anti-Spam] All anti-spam checks passed`);
  return { canSend: true };
}
