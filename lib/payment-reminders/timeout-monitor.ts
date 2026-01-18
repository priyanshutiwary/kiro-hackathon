/**
 * Timeout Monitor Module
 * 
 * Handles detection and management of reminders stuck in 'in_progress' state.
 * Reminders that have been in progress for more than 10 minutes are marked as failed
 * with appropriate skip reasons for monitoring and retry scheduling.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { db } from "@/db/drizzle";
import { paymentReminders } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";

/**
 * Timeout threshold in milliseconds (10 minutes)
 */
const TIMEOUT_THRESHOLD_MS = 10 * 60 * 1000;

/**
 * Checks for timed-out reminders and marks them as failed
 * 
 * This function:
 * 1. Queries for reminders in 'in_progress' state
 * 2. Filters for reminders older than 10 minutes
 * 3. Marks timed-out reminders as 'failed'
 * 4. Sets skip_reason to 'Call timeout - no agent response'
 * 5. Logs timeout events for monitoring
 * 
 * Requirements:
 * - 6.1: Mark reminders 'in_progress' for > 10 minutes as 'failed'
 * - 6.2: Set skip_reason to 'Call timeout - no agent response'
 * - 6.3: Log timeout events for monitoring
 * - 6.4: Run during each cron execution
 * - 6.5: Allow retry scheduling for timed-out reminders
 * 
 * @returns Promise that resolves when timeout check is complete
 */
export async function checkTimeouts(): Promise<void> {
  console.log('[Timeout Monitor] Starting timeout check...');
  
  try {
    // Calculate cutoff time (10 minutes ago)
    const cutoffTime = new Date(Date.now() - TIMEOUT_THRESHOLD_MS);
    
    console.log(`[Timeout Monitor] Checking for reminders in 'in_progress' state before ${cutoffTime.toISOString()}`);
    
    // Query for reminders in 'in_progress' state older than 10 minutes (Requirement 6.1)
    const timedOutReminders = await db
      .select()
      .from(paymentReminders)
      .where(
        and(
          eq(paymentReminders.status, 'in_progress'),
          lt(paymentReminders.updatedAt, cutoffTime)
        )
      );
    
    if (timedOutReminders.length === 0) {
      console.log('[Timeout Monitor] No timed-out reminders found');
      return;
    }
    
    console.log(`[Timeout Monitor] Found ${timedOutReminders.length} timed-out reminder(s)`);
    
    // Process each timed-out reminder
    for (const reminder of timedOutReminders) {
      try {
        // Log timeout event for monitoring (Requirement 6.3)
        console.warn(
          `[Timeout Monitor] TIMEOUT DETECTED: Reminder ${reminder.id} has been in 'in_progress' state since ${reminder.updatedAt.toISOString()}`
        );
        
        // Mark as failed with appropriate skip_reason (Requirements 6.1, 6.2)
        await db
          .update(paymentReminders)
          .set({
            status: 'failed',
            skipReason: 'Call timeout - no agent response',
            updatedAt: new Date(),
          })
          .where(eq(paymentReminders.id, reminder.id));
        
        console.log(`[Timeout Monitor] Reminder ${reminder.id} marked as failed due to timeout`);
        
        // Note: The reminder can still be retried by the retry scheduler (Requirement 6.5)
        // The 'failed' status with this specific skip_reason allows retry logic to work
        
      } catch (error) {
        console.error(`[Timeout Monitor] Error processing timed-out reminder ${reminder.id}:`, error);
        // Continue processing other timed-out reminders even if one fails
      }
    }
    
    console.log(`[Timeout Monitor] Timeout check complete. Processed ${timedOutReminders.length} timed-out reminder(s)`);
    
  } catch (error) {
    console.error('[Timeout Monitor] Error during timeout check:', error);
    throw error;
  }
}
