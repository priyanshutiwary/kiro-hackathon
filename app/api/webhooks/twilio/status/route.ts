import { db } from "@/db/drizzle";
import { paymentReminders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Twilio webhook endpoint for receiving SMS status updates
 * 
 * Requirements:
 * - 6.1: Update reminder status when SMS is sent
 * - 6.2: Update reminder status when Twilio confirms delivery
 * - 6.3: Update reminder status when Twilio reports delivery failure
 * - 6.4: Record timestamp in lastAttemptAt when SMS status is updated
 * - 6.5: Handle Twilio webhook callbacks for status updates
 * - 9.4: Log errors with context (no PII - don't log full phone numbers)
 * - 9.5: Handle webhook processing errors
 */

/**
 * Twilio webhook payload structure
 */
interface TwilioWebhookPayload {
  MessageSid: string;
  MessageStatus: string;
  To: string;
  From: string;
  ErrorCode?: string;
  ErrorMessage?: string;
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
 * Validate Twilio webhook signature
 * 
 * Twilio signs webhook requests using HMAC-SHA1 with the auth token.
 * The signature is sent in the X-Twilio-Signature header.
 * 
 * @param url - Full webhook URL
 * @param params - Webhook parameters
 * @param signature - Signature from X-Twilio-Signature header
 * @param authToken - Twilio auth token
 * @returns true if signature is valid
 */
function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
  authToken: string
): boolean {
  if (!signature) {
    return false;
  }

  try {
    // Twilio signature validation algorithm:
    // 1. Take the full URL of the request (including protocol and query string)
    // 2. Sort parameters alphabetically and append them to the URL
    // 3. Sign the resulting string with HMAC-SHA1 using auth token
    // 4. Base64 encode the result
    
    let data = url;
    
    // Sort parameters alphabetically and append to URL
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      data += key + params[key];
    }
    
    // Create HMAC-SHA1 signature
    const hmac = crypto.createHmac('sha1', authToken);
    hmac.update(data);
    const expectedSignature = hmac.digest('base64');
    
    // Check if signatures have the same length before timing-safe comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Twilio Webhook] Error validating signature:', error);
    return false;
  }
}

/**
 * Map Twilio message status to internal reminder status
 * 
 * Twilio statuses: queued, sent, delivered, failed, undelivered
 * Internal statuses: pending, in_progress, completed, failed
 */
function mapTwilioStatus(twilioStatus: string): string {
  switch (twilioStatus.toLowerCase()) {
    case 'delivered':
    case 'sent':
      return 'completed';
    case 'failed':
    case 'undelivered':
      return 'failed';
    case 'queued':
    case 'sending':
      return 'in_progress';
    default:
      return 'in_progress';
  }
}

/**
 * POST /api/webhooks/twilio/status
 * 
 * Handles Twilio webhook callbacks for SMS status updates
 * Logs all webhook processing with context (no PII)
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log(`[Twilio Webhook] Received webhook request`);
    
    // Get webhook secret from environment
    const webhookSecret = process.env.TWILIO_AUTH_TOKEN;
    if (!webhookSecret) {
      console.error('[Twilio Webhook] TWILIO_AUTH_TOKEN not configured - webhook authentication disabled');
      return NextResponse.json(
        { success: false, message: 'Webhook authentication not configured' },
        { status: 500 }
      );
    }

    // Parse form data (Twilio sends application/x-www-form-urlencoded)
    const formData = await request.formData();
    const params: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate Twilio signature (Requirement 6.5)
    const signature = request.headers.get('X-Twilio-Signature');
    const url = request.url;
    
    if (!validateTwilioSignature(url, params, signature, webhookSecret)) {
      console.error('[Twilio Webhook] Invalid signature - potential security issue');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log(`[Twilio Webhook] Signature validated successfully`);

    // Extract webhook data
    const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = params;
    const maskedPhone = maskPhoneNumber(To);

    // Validate required fields
    if (!MessageSid || !MessageStatus) {
      console.error('[Twilio Webhook] Missing required fields in webhook payload');
      return NextResponse.json(
        { success: false, message: 'Missing required fields: MessageSid and MessageStatus' },
        { status: 400 }
      );
    }

    console.log(`[Twilio Webhook] Processing status update - SID: ${MessageSid}, Status: ${MessageStatus}, To: ${maskedPhone}`);

    // Find reminder by externalId (Twilio message SID)
    const reminders = await db
      .select()
      .from(paymentReminders)
      .where(eq(paymentReminders.externalId, MessageSid))
      .limit(1);

    if (reminders.length === 0) {
      console.warn(`[Twilio Webhook] Reminder not found for message SID: ${MessageSid} - may have been deleted`);
      return NextResponse.json(
        { success: false, message: 'Reminder not found' },
        { status: 404 }
      );
    }

    const reminder = reminders[0];
    console.log(`[Twilio Webhook] Found reminder ${reminder.id} for message ${MessageSid}`);

    // Map Twilio status to internal status
    const newStatus = mapTwilioStatus(MessageStatus);
    
    console.log(`[Twilio Webhook] Updating reminder ${reminder.id}: ${reminder.status} → ${newStatus}`);

    // Prepare update data
    const now = new Date();
    const updateData: any = {
      status: newStatus,
      lastAttemptAt: now, // Requirement 6.4
      updatedAt: now,
    };

    // Store error information if delivery failed (Requirement 9.4)
    if (newStatus === 'failed' && (ErrorCode || ErrorMessage)) {
      const errorInfo = {
        errorCode: ErrorCode,
        errorMessage: ErrorMessage,
        reportedAt: now.toISOString(),
      };
      updateData.skipReason = JSON.stringify(errorInfo);
      console.error(`[Twilio Webhook] Delivery failed - Code: ${ErrorCode}, Message: ${ErrorMessage}`);
    }

    // Update reminder status (Requirements 6.1, 6.2, 6.3)
    await db
      .update(paymentReminders)
      .set(updateData)
      .where(eq(paymentReminders.id, reminder.id));

    const processingTime = Date.now() - startTime;
    console.log(`[Twilio Webhook] Successfully updated reminder ${reminder.id} in ${processingTime}ms`);

    // Return success response
    return NextResponse.json(
      { success: true, message: 'Status update processed successfully' },
      { status: 200 }
    );

  } catch (error) {
    // Handle unexpected errors (Requirement 9.5)
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[Twilio Webhook] Error processing webhook after ${processingTime}ms:`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
