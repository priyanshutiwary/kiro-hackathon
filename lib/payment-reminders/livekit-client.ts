/**
 * LiveKit Client for Payment Reminder Calls
 * 
 * This module provides integration with LiveKit for making outbound voice calls
 * to customers about payment reminders. It handles call initiation, context
 * preparation, and outcome tracking.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 17.1, 17.2, 17.3, 17.4, 17.5
 */

/**
 * Call context provided to the voice agent
 * Contains all invoice and customer information needed for the call
 * 
 * Requirements: 8.2, 14.1-14.9
 */
export interface CallContext {
  /** Customer's full name */
  customerName: string;
  
  /** Invoice number for reference */
  invoiceNumber: string;
  
  /** Original total amount of the invoice */
  originalAmount: number;
  
  /** Current amount still due (may differ from original if partially paid) */
  amountDue: number;
  
  /** Due date in ISO format (YYYY-MM-DD) */
  dueDate: string;
  
  /** Number of days until due (positive) or days overdue (negative) */
  daysUntilDue: number;
  
  /** Whether the invoice is currently overdue */
  isOverdue: boolean;
  
  /** Available payment methods (e.g., ["credit_card", "bank_transfer", "check"]) */
  paymentMethods: string[];
  
  /** Company name making the call */
  companyName: string;
  
  /** Support phone number for customer questions */
  supportPhone: string;
}

/**
 * Outcome of a call attempt
 * Tracks connection status, duration, and customer response
 * 
 * Requirements: 8.3, 8.4, 8.5
 */
export interface CallOutcome {
  /** Whether the call successfully connected */
  connected: boolean;
  
  /** Call duration in seconds (0 if not connected) */
  duration: number;
  
  /** Customer's response category */
  customerResponse: 'will_pay_today' | 'already_paid' | 'dispute' | 'no_answer' | 'no_phone_number' | 'other';
  
  /** Additional notes or details from the call */
  notes?: string;
  
  /** LiveKit call ID for reference and tracking */
  livekitCallId?: string;
}

/**
 * Configuration for LiveKit API
 */
interface LiveKitConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Custom error types for LiveKit operations
 * Requirements: 17.4, 17.5
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

export class NetworkTimeoutError extends LiveKitError {
  constructor(phoneNumber: string) {
    super(
      `Network timeout while calling ${phoneNumber}. Please retry.`,
      'NETWORK_TIMEOUT'
    );
    this.name = 'NetworkTimeoutError';
  }
}

export class ConfigurationError extends LiveKitError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * Get LiveKit configuration from environment variables
 * 
 * @throws ConfigurationError if required environment variables are missing
 */
function getLiveKitConfig(): LiveKitConfig {
  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiUrl || !apiKey || !apiSecret) {
    throw new ConfigurationError(
      'LiveKit configuration missing. Please set LIVEKIT_API_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET environment variables.'
    );
  }

  return { apiUrl, apiKey, apiSecret };
}

/**
 * Build the agent prompt with invoice context
 * Creates a structured prompt for the voice agent with all necessary information
 * 
 * Requirements: 8.2, 17.6
 */
function buildAgentPrompt(context: CallContext): string {
  const daysText = context.isOverdue
    ? `${Math.abs(context.daysUntilDue)} days overdue`
    : context.daysUntilDue === 0
    ? 'due today'
    : `due in ${context.daysUntilDue} days`;

  return `You are a professional payment reminder agent calling on behalf of ${context.companyName}.

Customer Information:
- Name: ${context.customerName}
- Invoice Number: ${context.invoiceNumber}
- Amount Due: $${context.amountDue.toFixed(2)}
- Original Amount: $${context.originalAmount.toFixed(2)}
- Due Date: ${context.dueDate} (${daysText})

Your goal is to:
1. Politely remind the customer about their outstanding invoice
2. Confirm they received the invoice
3. Ask if they have any questions about the charges
4. Determine their payment intention

Available payment methods: ${context.paymentMethods.join(', ')}

If the customer has questions, provide the support phone number: ${context.supportPhone}

Be professional, courteous, and understanding. Listen carefully to the customer's response and categorize it as:
- "will_pay_today" if they commit to paying today
- "already_paid" if they claim to have already paid
- "dispute" if they dispute the charges or have concerns
- "no_answer" if there's no response or voicemail
- "other" for any other response

Keep the call brief and focused on the payment reminder.`;
}

/**
 * Make an outbound call via LiveKit
 * Initiates a voice call with the provided context and returns the outcome
 * 
 * Requirements: 8.1, 8.2, 17.1, 17.2, 17.3, 17.4, 17.5
 * 
 * @param phoneNumber - Customer phone number in E.164 format (e.g., +1234567890)
 * @param context - Call context with invoice and customer information
 * @returns Promise resolving to the call outcome
 * @throws InvalidPhoneNumberError if phone number format is invalid
 * @throws ConfigurationError if LiveKit configuration is missing
 * @throws NetworkTimeoutError if network timeout occurs
 * @throws CallInitiationError if call initiation fails
 */
export async function makeCall(
  phoneNumber: string,
  context: CallContext
): Promise<CallOutcome> {
  // Validate phone number format (basic E.164 validation)
  // Requirements: 17.4 - Handle invalid phone numbers
  if (!phoneNumber || !phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
    throw new InvalidPhoneNumberError(phoneNumber);
  }

  try {
    const config = getLiveKitConfig();
    const agentPrompt = buildAgentPrompt(context);

    // TODO: Implement actual LiveKit API call
    // This is a placeholder implementation that should be replaced with actual LiveKit SDK integration
    // The actual implementation would use the LiveKit SDK to:
    // 1. Create a room
    // 2. Configure the voice agent with the prompt
    // 3. Initiate the outbound call
    // 4. Wait for call completion
    // 5. Parse and return the outcome

    // For now, we'll throw an error to indicate this needs implementation
    throw new CallInitiationError('LiveKit integration not yet implemented. This requires the LiveKit SDK and proper API configuration.');

    // Example structure of what the implementation would look like:
    /*
    const response = await fetch(`${config.apiUrl}/v1/calls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        agentPrompt,
        context,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new CallInitiationError(`LiveKit API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      connected: result.connected,
      duration: result.duration,
      customerResponse: result.customerResponse,
      notes: result.notes,
      livekitCallId: result.callId,
    };
    */
  } catch (error) {
    // Handle different error types
    // Requirements: 17.4, 17.5 - Handle call initiation failures, invalid phone numbers, network timeouts
    
    // Re-throw our custom errors
    if (error instanceof InvalidPhoneNumberError ||
        error instanceof ConfigurationError ||
        error instanceof NetworkTimeoutError ||
        error instanceof CallInitiationError) {
      throw error;
    }

    if (error instanceof Error) {
      // Handle network timeouts
      if (error.message.includes('timeout') || 
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND')) {
        throw new NetworkTimeoutError(phoneNumber);
      }

      // Handle other errors as call initiation failures
      throw new CallInitiationError(error.message);
    }

    // Handle unknown errors
    throw new CallInitiationError(`Unknown error while making call to ${phoneNumber}`);
  }
}

/**
 * Get the status of an ongoing or completed call
 * 
 * Requirements: 17.5
 * 
 * @param callId - LiveKit call ID
 * @returns Promise resolving to the call status
 * @throws ConfigurationError if LiveKit configuration is missing
 * @throws NetworkTimeoutError if network timeout occurs
 * @throws LiveKitError if API call fails
 */
export async function getCallStatus(callId: string): Promise<{
  status: 'in_progress' | 'completed' | 'failed';
  outcome?: CallOutcome;
}> {
  try {
    const config = getLiveKitConfig();

    // TODO: Implement actual LiveKit API call to get status
    throw new CallInitiationError('LiveKit getCallStatus not yet implemented');

    // Example structure:
    /*
    const response = await fetch(`${config.apiUrl}/v1/calls/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LiveKitError(
        `LiveKit API error: ${response.status} ${response.statusText} - ${errorText}`,
        'API_ERROR'
      );
    }

    const result = await response.json();
    return {
      status: result.status,
      outcome: result.outcome,
    };
    */
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof ConfigurationError ||
        error instanceof NetworkTimeoutError ||
        error instanceof LiveKitError) {
      throw error;
    }

    if (error instanceof Error) {
      // Handle network timeouts
      if (error.message.includes('timeout') || 
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND')) {
        throw new NetworkTimeoutError(callId);
      }

      throw new LiveKitError(`Failed to get call status for ${callId}: ${error.message}`, 'STATUS_ERROR');
    }
    
    throw new LiveKitError(`Unknown error while getting call status for ${callId}`, 'UNKNOWN_ERROR');
  }
}
