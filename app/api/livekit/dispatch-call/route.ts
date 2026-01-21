/**
 * LiveKit Call Dispatch API
 * 
 * Endpoint for dispatching payment reminder calls via LiveKit.
 * This provides a clean interface for the payment reminder system
 * to initiate calls without dealing with LiveKit internals.
 */

import { NextResponse } from "next/server";
import { dispatchPaymentCall, PaymentCallContext } from "@/lib/livekit/call-dispatcher";

/**
 * POST /api/livekit/dispatch-call
 * 
 * Dispatches a payment reminder call to a customer.
 * 
 * Request body:
 * {
 *   customerName: string;
 *   customerPhone: string;
 *   invoiceNumber: string;
 *   amountDue: number;
 *   currencyCode: string;
 *   currencySymbol: string;
 *   dueDate: string;
 *   companyName: string;
 *   supportPhone: string;
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   roomName: string;
 *   sipParticipantId?: string;
 *   error?: string;
 * }
 */
export async function POST(request: Request) {
  try {
    const context: PaymentCallContext = await request.json();

    // Validate required fields
    const requiredFields = ['customerName', 'customerPhone', 'invoiceNumber', 'amountDue', 'currencyCode', 'dueDate', 'companyName'];
    const missingFields = requiredFields.filter(field => !context[field as keyof PaymentCallContext]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Dispatch the call
    const result = await dispatchPaymentCall(context);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error dispatching call:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
