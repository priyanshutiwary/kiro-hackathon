import { db } from "@/db/drizzle";
import { paymentReminders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Webhook endpoint for receiving call status updates from the Python agent
 * 
 * Requirements:
 * - 1.1: Authenticate requests using WEBHOOK_SECRET
 * - 1.3: Return 404 for invalid reminder IDs
 * - 1.4: Return 200 for successful processing
 * - 1.5: Return 401 for authentication failures
 * - 5.1: Handle validation errors appropriately
 */

interface WebhookRequest {
  reminder_id: string;
  event_type: 'call_answered' | 'call_completed' | 'call_failed';
  outcome?: {
    connected: boolean;
    duration: number;
    customer_response: 'will_pay_today' | 'already_paid' | 'dispute' | 'no_answer';
    notes?: string;
  };
  timestamp?: string;
}

/**
 * Verify HMAC signature for webhook authentication
 */
function verifyHmacSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying HMAC signature:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    
    // Get the signature from headers
    const signature = request.headers.get('x-webhook-signature');
    
    // Verify authentication (Requirement 1.1, 1.5)
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { success: false, message: 'Webhook authentication not configured' },
        { status: 500 }
      );
    }

    if (!verifyHmacSignature(rawBody, signature, webhookSecret)) {
      console.error('Webhook authentication failed');
      return NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Parse the request body
    let payload: WebhookRequest;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields (Requirement 5.1)
    if (!payload.reminder_id || !payload.event_type) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: reminder_id and event_type' },
        { status: 400 }
      );
    }

    // Validate event_type
    const validEventTypes = ['call_answered', 'call_completed', 'call_failed'];
    if (!validEventTypes.includes(payload.event_type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid event_type' },
        { status: 400 }
      );
    }

    // Check if reminder exists (Requirement 1.3)
    const reminders = await db
      .select()
      .from(paymentReminders)
      .where(eq(paymentReminders.id, payload.reminder_id))
      .limit(1);

    if (reminders.length === 0) {
      console.error(`Reminder not found: ${payload.reminder_id}`);
      return NextResponse.json(
        { success: false, message: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Process the status update (will be implemented in task 2)
    await handleStatusUpdate(
      payload.reminder_id,
      payload.event_type,
      payload.outcome
    );

    // Return success response (Requirement 1.4)
    return NextResponse.json(
      { success: true, message: 'Status update processed successfully' },
      { status: 200 }
    );

  } catch (error) {
    // Handle unexpected errors without crashing (Requirement 5.1, 5.3)
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle status update based on event type
 * 
 * Requirements:
 * - 1.2: Update reminder record based on call status
 * - 2.2: Handle 'call_answered' → 'processing' transition
 * - 2.3: Handle 'call_completed' → 'completed' or 'pending' transition
 * - 2.4: Handle 'call_failed' → 'failed' transition
 * - 2.5: Handle no_answer → 'pending' for retry
 * - 3.1-3.5: Store call outcome data and update timestamp
 * - 7.1-7.5: Schedule retry for failed reminders
 */
async function handleStatusUpdate(
  reminderId: string,
  eventType: string,
  outcome?: WebhookRequest['outcome']
): Promise<void> {
  console.log(`Processing status update for reminder ${reminderId}: ${eventType}`, outcome);
  
  const now = new Date();
  
  // Handle different event types with appropriate status transitions
  switch (eventType) {
    case 'call_answered':
      // Requirement 2.2: call_answered → 'processing'
      await db
        .update(paymentReminders)
        .set({
          status: 'processing',
          updatedAt: now
        })
        .where(eq(paymentReminders.id, reminderId));
      
      console.log(`Reminder ${reminderId} status updated to 'processing'`);
      break;
    
    case 'call_completed':
      // Requirement 2.3, 2.5: call_completed → 'completed' or 'pending' (if no_answer)
      // Determine final status based on outcome
      let finalStatus = 'completed';
      let shouldScheduleRetry = false;
      
      // If customer didn't answer, set to pending for retry (Requirement 2.5)
      if (outcome?.customer_response === 'no_answer') {
        finalStatus = 'pending';
        shouldScheduleRetry = true;
        console.log(`Reminder ${reminderId} marked as 'pending' for retry (no answer)`);
      } else {
        console.log(`Reminder ${reminderId} marked as 'completed'`);
      }
      
      // Prepare call outcome data (Requirements 3.1-3.4)
      const callOutcomeData = outcome ? {
        connected: outcome.connected,
        duration: outcome.duration,
        customer_response: outcome.customer_response,
        notes: outcome.notes || null,
        reported_at: now.toISOString()
      } : null;
      
      // Update reminder with status, outcome data, and timestamp (Requirement 3.5)
      await db
        .update(paymentReminders)
        .set({
          status: finalStatus,
          callOutcome: callOutcomeData ? JSON.stringify(callOutcomeData) : null,
          lastAttemptAt: now, // Requirement 3.5: Update last_attempt_at timestamp
          updatedAt: now
        })
        .where(eq(paymentReminders.id, reminderId));
      
      // Schedule retry if needed (Requirements 7.1-7.5)
      if (shouldScheduleRetry) {
        const { scheduleRetry } = await import("@/lib/payment-reminders/reminder-executor");
        await scheduleRetry(reminderId);
      }
      
      break;
    
    case 'call_failed':
      // Requirement 2.4: call_failed → 'failed'
      // Store failure information if outcome data is provided
      const failureOutcomeData = outcome ? {
        connected: false,
        duration: outcome.duration || 0,
        customer_response: outcome.customer_response || 'no_answer',
        notes: outcome.notes || 'Call failed to connect',
        reported_at: now.toISOString()
      } : null;
      
      await db
        .update(paymentReminders)
        .set({
          status: 'pending', // Set to pending so retry can be scheduled
          callOutcome: failureOutcomeData ? JSON.stringify(failureOutcomeData) : null,
          lastAttemptAt: now,
          updatedAt: now
        })
        .where(eq(paymentReminders.id, reminderId));
      
      console.log(`Reminder ${reminderId} marked as 'pending' for retry after failure`);
      
      // Schedule retry for failed call (Requirements 7.1-7.5)
      const { scheduleRetry } = await import("@/lib/payment-reminders/reminder-executor");
      await scheduleRetry(reminderId);
      
      break;
    
    default:
      console.error(`Unknown event type: ${eventType}`);
      throw new Error(`Unknown event type: ${eventType}`);
  }
}
