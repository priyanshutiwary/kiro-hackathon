/**
 * Twilio SMS Client for Payment Reminders
 * 
 * Handles SMS sending via Twilio API for payment reminder notifications.
 * Provides methods for sending SMS and querying message status.
 */

/**
 * Twilio configuration from environment variables
 */
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

/**
 * Result of an SMS send operation
 */
export interface SMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * SMS message status from Twilio
 */
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';

/**
 * Custom error types for Twilio operations
 */
export class TwilioError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'TwilioError';
  }
}

export class TwilioConfigError extends TwilioError {
  constructor(message: string) {
    super(`Twilio configuration error: ${message}`, 'TWILIO_CONFIG_ERROR');
    this.name = 'TwilioConfigError';
  }
}

export class TwilioAPIError extends TwilioError {
  constructor(message: string, public readonly statusCode?: number) {
    super(`Twilio API error: ${message}`, 'TWILIO_API_ERROR');
    this.name = 'TwilioAPIError';
  }
}

export class TwilioRateLimitError extends TwilioError {
  constructor(public readonly retryAfter?: number) {
    super(
      `Twilio rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}`,
      'TWILIO_RATE_LIMIT'
    );
    this.name = 'TwilioRateLimitError';
  }
}

/**
 * Twilio SMS Client
 * 
 * Provides methods for sending SMS messages and querying message status
 * via the Twilio REST API.
 */
export class TwilioSMSClient {
  private config: TwilioConfig;
  private baseUrl: string;

  constructor(config?: Partial<TwilioConfig>) {
    // Load configuration from environment or provided config
    this.config = {
      accountSid: config?.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
      authToken: config?.authToken || process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: config?.phoneNumber || process.env.TWILIO_PHONE_NUMBER || '',
    };

    // Validate configuration
    this.validateConfig();

    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}`;
  }

  /**
   * Validate Twilio configuration
   * @throws {TwilioConfigError} if configuration is invalid
   */
  private validateConfig(): void {
    if (!this.config.accountSid) {
      throw new TwilioConfigError('TWILIO_ACCOUNT_SID is required');
    }
    if (!this.config.authToken) {
      throw new TwilioConfigError('TWILIO_AUTH_TOKEN is required');
    }
    if (!this.config.phoneNumber) {
      throw new TwilioConfigError('TWILIO_PHONE_NUMBER is required');
    }

    // Validate phone number format (E.164)
    if (!this.config.phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      throw new TwilioConfigError(
        `Invalid phone number format: ${this.config.phoneNumber}. Must be in E.164 format (e.g., +1234567890)`
      );
    }
  }

  /**
   * Get Basic Auth header for Twilio API
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(
      `${this.config.accountSid}:${this.config.authToken}`
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Mask phone number for logging (PII protection)
   * Shows only last 4 digits: +1234567890 -> +******7890
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) {
      return '****';
    }
    const lastFour = phoneNumber.slice(-4);
    return `+******${lastFour}`;
  }

  /**
   * Send an SMS message via Twilio
   * 
   * @param to - Recipient phone number in E.164 format (e.g., +1234567890)
   * @param message - Message content (max 1600 characters, but 160 recommended)
   * @returns Promise resolving to SMS result with message SID or error
   */
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    const maskedPhone = this.maskPhoneNumber(to);
    console.log(`[Twilio Client] Sending SMS to ${maskedPhone}`);

    // Validate recipient phone number (invalid phone = don't retry)
    if (!to.match(/^\+[1-9]\d{1,14}$/)) {
      const error = `Invalid recipient phone number format. Must be in E.164 format`;
      console.error(`[Twilio Client] ${error} - phone: ${maskedPhone}`);
      return {
        success: false,
        error: `INVALID_PHONE_NUMBER: ${error}`,
      };
    }

    // Validate message content
    if (!message || message.trim().length === 0) {
      const error = 'Message content cannot be empty';
      console.error(`[Twilio Client] ${error}`);
      return {
        success: false,
        error: `INVALID_MESSAGE: ${error}`,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: this.config.phoneNumber,
          Body: message,
        }),
      });

      // Handle rate limiting (wait and retry)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retrySeconds = retryAfter ? parseInt(retryAfter) : 60;
        console.warn(`[Twilio Client] Rate limit exceeded. Retry after ${retrySeconds} seconds`);
        throw new TwilioRateLimitError(retrySeconds);
      }

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.code || response.status;
        const errorMessage = data.message || response.statusText;
        
        // Log error with context (no PII)
        console.error(`[Twilio Client] API error ${errorCode}: ${errorMessage} - phone: ${maskedPhone}`);
        
        // Check for specific Twilio error codes that shouldn't retry
        const noRetryErrors = [
          21211, // Invalid 'To' phone number
          21612, // The 'To' phone number is not currently reachable via SMS
          21614, // 'To' number is not a valid mobile number
          30003, // Unreachable destination handset
          30004, // Message blocked
          30005, // Unknown destination handset
          30006, // Landline or unreachable carrier
        ];
        
        if (noRetryErrors.includes(errorCode)) {
          console.error(`[Twilio Client] Non-retryable error ${errorCode} - marking as permanent failure`);
          return {
            success: false,
            error: `INVALID_PHONE_NUMBER: ${errorMessage} (code: ${errorCode})`,
          };
        }
        
        throw new TwilioAPIError(errorMessage, response.status);
      }

      console.log(`[Twilio Client] SMS sent successfully. SID: ${data.sid}, to: ${maskedPhone}`);

      return {
        success: true,
        messageSid: data.sid,
      };

    } catch (error) {
      // Log error with context (no PII)
      console.error(`[Twilio Client] Error sending SMS to ${maskedPhone}:`, error);

      // Re-throw our custom errors for proper handling upstream
      if (error instanceof TwilioRateLimitError || error instanceof TwilioAPIError) {
        throw error;
      }

      // Handle network errors (schedule retry with exponential backoff)
      if (error instanceof Error) {
        console.error(`[Twilio Client] Network error: ${error.message}`);
        return {
          success: false,
          error: `NETWORK_ERROR: ${error.message}`,
        };
      }

      return {
        success: false,
        error: 'UNKNOWN_ERROR: Unknown error while sending SMS',
      };
    }
  }

  /**
   * Get the status of a sent message
   * 
   * @param messageSid - Twilio message SID
   * @returns Promise resolving to message status
   */
  async getMessageStatus(messageSid: string): Promise<MessageStatus> {
    console.log(`[Twilio Client] Querying status for message ${messageSid}`);

    if (!messageSid) {
      throw new TwilioAPIError('Message SID is required');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Messages/${messageSid}.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
          },
        }
      );

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new TwilioRateLimitError(retryAfter ? parseInt(retryAfter) : undefined);
      }

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new TwilioAPIError(errorMessage, response.status);
      }

      const data = await response.json();
      const status = data.status as MessageStatus;

      console.log(`[Twilio Client] Message status: ${status}`);

      return status;

    } catch (error) {
      console.error(`[Twilio Client] Error querying message status:`, error);

      // Re-throw our custom errors
      if (error instanceof TwilioRateLimitError || error instanceof TwilioAPIError) {
        throw error;
      }

      // Wrap other errors
      if (error instanceof Error) {
        throw new TwilioAPIError(error.message);
      }

      throw new TwilioAPIError('Unknown error while querying message status');
    }
  }
}

/**
 * Create a singleton instance of TwilioSMSClient
 * 
 * This ensures we reuse the same client instance across the application.
 * Returns null if Twilio credentials are not configured.
 */
let twilioClientInstance: TwilioSMSClient | null = null;

export function getTwilioClient(): TwilioSMSClient | null {
  if (twilioClientInstance) {
    return twilioClientInstance;
  }

  try {
    twilioClientInstance = new TwilioSMSClient();
    return twilioClientInstance;
  } catch (error) {
    if (error instanceof TwilioConfigError) {
      console.warn('[Twilio Client] Twilio not configured:', error.message);
      return null;
    }
    throw error;
  }
}
