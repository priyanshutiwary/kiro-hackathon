/**
 * Reminder Processing Cron Job
 * 
 * This endpoint is called by a cron scheduler (e.g., Vercel Cron) to process
 * due payment reminders and initiate calls.
 * 
 * Requirements: 15.7
 */

import { NextResponse } from "next/server";
import { processReminders } from "@/lib/payment-reminders/reminder-scheduler";

/**
 * POST handler for the cron job
 * 
 * This should be called by a cron scheduler every 30 minutes to process
 * due reminders and initiate calls.
 * 
 * Security: In production, this endpoint should be protected with:
 * - Vercel Cron Secret header verification
 * - Or API key authentication
 * - Or IP whitelist
 * 
 * Requirements: 15.7
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret (if using Vercel Cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting reminder processing...');
    
    const startTime = Date.now();
    
    // Track errors for alerting
    let processingErrors = 0;
    
    // Process all due reminders
    try {
      await processReminders();
    } catch (error) {
      processingErrors++;
      console.error('[Cron] Error during reminder processing:', error);
      
      // Alert on repeated call failures (Requirement 9.1)
      console.error('[Cron] ALERT: Reminder processing failed');
      // In production, this would trigger an alert to monitoring service
      // await sendAlert('Reminder Processing Failure', { error: error.message });
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`[Cron] Reminder processing complete in ${duration}ms`);
    
    // Alert if processing took unusually long (potential issue)
    if (duration > 60000) { // More than 1 minute
      console.warn(`[Cron] WARNING: Reminder processing took ${duration}ms (> 60s)`);
      // In production, this might trigger a performance alert
    }

    return NextResponse.json({
      success: processingErrors === 0,
      message: processingErrors === 0 ? 'Reminder processing completed' : 'Reminder processing completed with errors',
      duration,
      timestamp: new Date().toISOString(),
      errors: processingErrors,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Cron] Fatal error in reminder processing:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process reminders',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for manual testing
 * 
 * This allows manual triggering of the reminder processing for testing purposes.
 * In production, you may want to disable this or add authentication.
 */
export async function GET(request: Request) {
  // Check if manual trigger is allowed
  const allowManualTrigger = process.env.ALLOW_MANUAL_CRON_TRIGGER === 'true';
  
  if (!allowManualTrigger) {
    return NextResponse.json(
      { error: 'Manual trigger not allowed' },
      { status: 403 }
    );
  }

  // Forward to POST handler
  return POST(request);
}
