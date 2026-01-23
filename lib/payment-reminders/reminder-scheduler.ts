/**
 * Reminder Scheduler Module
 * 
 * Handles the automatic processing of due reminders, checking call window eligibility,
 * and queueing calls for execution.
 * 
 * Requirements: 15.1-15.7
 */

import { db } from "@/db/drizzle";
import { paymentReminders} from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { canMakeCallNow } from "./call-window";
import { getUserSettings} from "./settings-manager";
import { executeReminder } from "./call-executor";
import { canSendReminder } from "./anti-spam";

/**
 * Processes due reminders and queues eligible calls
 * 
 * This function:
 * 1. Queries for reminders that are due (scheduled_date <= today)
 * 2. Filters for reminders with status = pending
 * 3. Filters for reminders where attempt_count < max_retry_attempts
 * 4. Checks call window eligibility for each reminder
 * 5. Queues eligible reminders for calling
 * 6. Processes reminders in chronological order
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 * 
 * @returns Promise that resolves when all due reminders are processed
 */
export async function processReminders(): Promise<void> {
  console.log('[Reminder Scheduler] Starting reminder processing...');
  
  // Track processing statistics for alerting
  let processedCount = 0;
  let queuedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Get current date (today) for comparison
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  // Query for due reminders (Requirements 15.1, 15.2, 15.3)
  // - scheduled_date <= today
  // - status = pending
  const dueReminders = await db
    .select()
    .from(paymentReminders)
    .where(
      and(
        lte(paymentReminders.scheduledDate, today),
        eq(paymentReminders.status, 'pending')
      )
    )
    .orderBy(paymentReminders.scheduledDate); // Requirement 15.6: chronological order
  
  console.log(`[Reminder Scheduler] Found ${dueReminders.length} due reminders`);
  
  // Process each reminder
  for (const reminder of dueReminders) {
    processedCount++;
    
    try {
      // Get user settings to check max retry attempts and call window
      const settings = await getUserSettings(reminder.userId);
      
      // Check if attempt count is below maximum (Requirement 15.4)
      if (reminder.attemptCount >= settings.maxRetryAttempts) {
        console.log(`[Reminder Scheduler] Reminder ${reminder.id} has reached max retry attempts, skipping`);
        skippedCount++;
        
        // Alert on repeated call failures (Requirement 9.1)
        if (reminder.attemptCount >= settings.maxRetryAttempts) {
          console.error(`[Reminder Scheduler] ALERT: Reminder ${reminder.id} failed after ${reminder.attemptCount} attempts`);
          // In production, this would trigger an alert for investigation
        }
        
        continue;
      }
      
      // Check anti-spam protection (Requirements 10.1, 10.2, 10.3, 10.5)
      const antiSpamCheck = canSendReminder(
        {
          attemptCount: reminder.attemptCount,
          lastAttemptAt: reminder.lastAttemptAt,
        },
        settings
      );
      
      if (!antiSpamCheck.canSend) {
        console.log(`[Reminder Scheduler] Reminder ${reminder.id} blocked by anti-spam: ${antiSpamCheck.reason}`);
        if (antiSpamCheck.nextAvailableTime) {
          console.log(`[Reminder Scheduler] Next available time: ${antiSpamCheck.nextAvailableTime}`);
        }
        skippedCount++;
        continue;
      }
      
      // Check call window eligibility (Requirement 15.5)
      const callWindowCheck = canMakeCallNow(settings);
      
      if (!callWindowCheck.canCall) {
        console.log(`[Reminder Scheduler] Reminder ${reminder.id} not eligible: ${callWindowCheck.reason}`);
        console.log(`[Reminder Scheduler] Next available time: ${callWindowCheck.nextAvailableTime}`);
        skippedCount++;
        continue;
      }
      
      // Queue the reminder for execution (Requirement 15.5)
      console.log(`[Reminder Scheduler] Queueing reminder ${reminder.id} for execution`);
      await queueCall(reminder.id);
      queuedCount++;
      
    } catch (error) {
      errorCount++;
      console.error(`[Reminder Scheduler] Error processing reminder ${reminder.id}:`, error);
      // Continue processing other reminders even if one fails
    }
  }
  
  console.log('[Reminder Scheduler] Reminder processing complete');
  console.log(`[Reminder Scheduler] Summary: ${processedCount} processed, ${queuedCount} queued, ${skippedCount} skipped, ${errorCount} errors`);
  
  // Alert on high error rate
  if (errorCount > 0 && processedCount > 0) {
    const errorRate = (errorCount / processedCount) * 100;
    if (errorRate > 20) { // More than 20% error rate
      console.error(`[Reminder Scheduler] ALERT: High error rate detected: ${errorRate.toFixed(1)}% (${errorCount}/${processedCount})`);
      // In production, this would trigger an alert to monitoring service
    }
  }
}

/**
 * Queues a reminder for execution (SMS or voice based on channel)
 * 
 * This function:
 * 1. Updates reminder status to 'in_progress'
 * 2. Executes the reminder via unified executor (routes to SMS or voice)
 * 3. Waits for webhook callback to handle outcome
 * 
 * Requirements: 15.5, 2.1 (webhook flow), 4.1 (channel routing)
 * 
 * @param reminderId - ID of the reminder to queue
 * @returns Promise that resolves when reminder execution is initiated
 */
export async function queueCall(reminderId: string): Promise<void> {
  console.log(`[Reminder Scheduler] Queueing reminder for execution: ${reminderId}`);
  
  try {
    // Update status to 'in_progress' before initiating (Requirement 2.1)
    await db
      .update(paymentReminders)
      .set({
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(paymentReminders.id, reminderId));
    
    console.log(`[Reminder Scheduler] Reminder ${reminderId} status updated to 'in_progress'`);
    
    // Execute reminder via unified executor (Requirement 4.1)
    // This will route to SMS or voice based on the channel field
    console.log(`[Reminder Scheduler] Executing reminder ${reminderId}`);
    await executeReminder(reminderId);
    
    console.log(`[Reminder Scheduler] Reminder ${reminderId} execution initiated, waiting for outcome`);
    
  } catch (error) {
    console.error(`[Reminder Scheduler] Error executing reminder ${reminderId}:`, error);
    
    // Update reminder status to 'failed' on error
    await db
      .update(paymentReminders)
      .set({
        status: 'failed',
        skipReason: `Error during execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        updatedAt: new Date(),
      })
      .where(eq(paymentReminders.id, reminderId));
    
    throw error;
  }
}
