/**
 * LiveKit Client for Payment Reminder Calls
 * 
 * Simplified client that delegates to the LiveKit dispatcher.
 * This keeps the payment reminder logic clean and separates LiveKit concerns.
 */

import { dispatchPaymentCall } from "@/lib/livekit/call-dispatcher";

/**
 * Call context provided to the voice agent
 */
export interface CallContext {
  customerName: string;
  invoiceNumber: string;
  originalAmount: number;
  amountDue: number;
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
  paymentMethods: string[];
  companyName: string;
  supportPhone: string;
  language?: string;
  voiceGender?: string;
  businessProfile: {
    companyName: string;
    businessDescription: string;
    industry: string | null;
    supportPhone: string;
    supportEmail: string | null;
    preferredPaymentMethods: string[];
  };
}

/**
 * Outcome of a call attempt
 */
export interface CallOutcome {
  connected: boolean;
  duration: number;
  customerResponse: 'will_pay_today' | 'already_paid' | 'dispute' | 'no_answer' | 'no_phone_number' | 'other';
  notes?: string;
  livekitCallId?: string;
}

/**
 * Custom error types
 */
export class LiveKitError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'LiveKitError';
  }
}

export class InvalidPhoneNumberError extends LiveKitError {
  constructor(phoneNumber: string) {
    super(
      `Invalid phone number format: ${phoneNumber}. Must be in E.164 format (e.g., +1234567890)`,
      'INVALID_PHONE_NUMBER'
    );
    this.name = 'InvalidPhoneNumberError';
  }
}

export class CallInitiationError extends LiveKitError {
  constructor(message: string) {
    super(`Failed to initiate call: ${message}`, 'CALL_INITIATION_FAILED');
    this.name = 'CallInitiationError';
  }
}

/**
 * Make an outbound call via LiveKit
 * 
 * This function dispatches a payment reminder call using the LiveKit dispatcher.
 * 
 * @param phoneNumber - Customer phone number
 * @param context - Call context with invoice and customer information
 * @returns Promise resolving to the call outcome
 */
export async function makeCall(
  phoneNumber: string,
  context: CallContext
): Promise<CallOutcome> {
  console.log(`[LiveKit Client] Initiating call to ${phoneNumber}`);
  console.log(`[LiveKit Client] Reminder ID: ${context.reminderId}`);

  try {
    // Dispatch the call via the LiveKit dispatcher
    const result = await dispatchPaymentCall({
      reminderId: context.reminderId,
      customerName: context.customerName,
      customerPhone: phoneNumber,
      invoiceNumber: context.invoiceNumber,
      amountDue: context.amountDue,
      dueDate: context.dueDate,
      companyName: context.companyName,
      supportPhone: context.supportPhone,
      language: context.language,
      voiceGender: context.voiceGender,
    });

    if (!result.success) {
      throw new CallInitiationError(result.error || 'Unknown error during call dispatch');
    }

    console.log(`[LiveKit Client] Call dispatched successfully. Room: ${result.roomName}`);

    // Return outcome
    // Note: In production, you'd listen to webhooks for actual call completion
    return {
      connected: true,
      duration: 0, // Will be updated via webhook
      customerResponse: 'other', // Will be updated via webhook
      notes: `Call initiated to ${phoneNumber} in room ${result.roomName}`,
      livekitCallId: result.sipParticipantId,
    };

  } catch (error) {
    console.error(`[LiveKit Client] Error making call:`, error);

    // Re-throw our custom errors
    if (error instanceof InvalidPhoneNumberError || error instanceof CallInitiationError) {
      throw error;
    }

    // Wrap other errors
    if (error instanceof Error) {
      throw new CallInitiationError(error.message);
    }

    throw new CallInitiationError('Unknown error while making call');
  }
}
