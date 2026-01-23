# Twilio SMS Client

## Overview

The Twilio SMS Client provides a simple interface for sending SMS messages and querying message status via the Twilio REST API. It's designed for payment reminder notifications but can be used for any SMS messaging needs.

## Features

- ✅ Send SMS messages via Twilio API
- ✅ Query message delivery status
- ✅ Phone number validation (E.164 format)
- ✅ Comprehensive error handling
- ✅ Rate limiting detection
- ✅ Network error handling
- ✅ Singleton pattern for efficient resource usage

## Installation

The client uses the native `fetch` API and doesn't require the Twilio SDK. Just configure your environment variables:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## Usage

### Basic Usage

```typescript
import { getTwilioClient } from '@/lib/payment-reminders/twilio-client';

// Get the singleton client instance
const client = getTwilioClient();

if (!client) {
  console.error('Twilio not configured');
  return;
}

// Send an SMS
const result = await client.sendSMS(
  '+1234567890',
  'Hi John, reminder: Invoice #1234 for $500.00 is due on Feb 15. - Acme Corp'
);

if (result.success) {
  console.log('SMS sent! Message SID:', result.messageSid);
} else {
  console.error('Failed to send SMS:', result.error);
}
```

### Query Message Status

```typescript
import { getTwilioClient } from '@/lib/payment-reminders/twilio-client';

const client = getTwilioClient();

if (client) {
  const status = await client.getMessageStatus('SM1234567890abcdef');
  console.log('Message status:', status); // 'delivered', 'failed', etc.
}
```

### Custom Configuration

```typescript
import { TwilioSMSClient } from '@/lib/payment-reminders/twilio-client';

// Create a client with custom configuration
const client = new TwilioSMSClient({
  accountSid: 'ACcustom123',
  authToken: 'custom_token',
  phoneNumber: '+9876543210',
});
```

## API Reference

### `TwilioSMSClient`

#### Constructor

```typescript
new TwilioSMSClient(config?: Partial<TwilioConfig>)
```

Creates a new Twilio SMS client. If no config is provided, reads from environment variables.

**Parameters:**
- `config` (optional): Partial configuration object
  - `accountSid`: Twilio Account SID
  - `authToken`: Twilio Auth Token
  - `phoneNumber`: Twilio phone number in E.164 format

**Throws:**
- `TwilioConfigError`: If required configuration is missing or invalid

#### `sendSMS(to: string, message: string): Promise<SMSResult>`

Sends an SMS message via Twilio.

**Parameters:**
- `to`: Recipient phone number in E.164 format (e.g., `+1234567890`)
- `message`: Message content (recommended max 160 characters)

**Returns:**
```typescript
{
  success: boolean;
  messageSid?: string;  // Twilio message SID if successful
  error?: string;       // Error message if failed
}
```

**Throws:**
- `TwilioAPIError`: For Twilio API errors
- `TwilioRateLimitError`: When rate limit is exceeded

#### `getMessageStatus(messageSid: string): Promise<MessageStatus>`

Queries the status of a sent message.

**Parameters:**
- `messageSid`: Twilio message SID

**Returns:**
- `MessageStatus`: One of `'queued'`, `'sent'`, `'delivered'`, `'failed'`, `'undelivered'`

**Throws:**
- `TwilioAPIError`: For Twilio API errors
- `TwilioRateLimitError`: When rate limit is exceeded

### `getTwilioClient(): TwilioSMSClient | null`

Returns a singleton instance of the Twilio client. Returns `null` if Twilio is not configured.

## Error Handling

### Error Types

#### `TwilioConfigError`

Thrown when Twilio configuration is missing or invalid.

```typescript
try {
  const client = new TwilioSMSClient();
} catch (error) {
  if (error instanceof TwilioConfigError) {
    console.error('Configuration error:', error.message);
  }
}
```

#### `TwilioAPIError`

Thrown when the Twilio API returns an error.

```typescript
try {
  await client.sendSMS('+1234567890', 'Test');
} catch (error) {
  if (error instanceof TwilioAPIError) {
    console.error('API error:', error.message);
    console.error('Status code:', error.statusCode);
  }
}
```

#### `TwilioRateLimitError`

Thrown when rate limit is exceeded.

```typescript
try {
  await client.sendSMS('+1234567890', 'Test');
} catch (error) {
  if (error instanceof TwilioRateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter, 'seconds');
  }
}
```

### Graceful Error Handling

The `sendSMS` method returns a result object instead of throwing for validation errors:

```typescript
const result = await client.sendSMS('invalid-phone', 'Test');

if (!result.success) {
  console.error('Validation error:', result.error);
  // Handle gracefully without try/catch
}
```

## Phone Number Validation

All phone numbers must be in E.164 format:

✅ Valid:
- `+1234567890` (US)
- `+447911123456` (UK)
- `+919876543210` (India)

❌ Invalid:
- `1234567890` (missing +)
- `+0123456789` (starts with 0)
- `+abc123` (contains letters)
- `+1` (too short)
- `+12345678901234567` (too long)

## Rate Limiting

Twilio enforces rate limits on API requests. When a rate limit is exceeded:

1. The client throws a `TwilioRateLimitError`
2. The error includes a `retryAfter` value (in seconds)
3. Your application should wait before retrying

```typescript
try {
  await client.sendSMS('+1234567890', 'Test');
} catch (error) {
  if (error instanceof TwilioRateLimitError) {
    const delay = error.retryAfter || 60;
    console.log(`Rate limited. Retrying after ${delay} seconds`);
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
    // Retry the request
  }
}
```

## Best Practices

### 1. Use the Singleton

Always use `getTwilioClient()` instead of creating new instances:

```typescript
// ✅ Good
const client = getTwilioClient();

// ❌ Avoid
const client = new TwilioSMSClient();
```

### 2. Check for Configuration

Always check if the client is configured before using:

```typescript
const client = getTwilioClient();

if (!client) {
  console.warn('Twilio not configured, skipping SMS');
  return;
}

// Safe to use client here
```

### 3. Keep Messages Short

SMS messages are charged per segment (160 characters). Keep messages concise:

```typescript
// ✅ Good (under 160 characters)
const message = `Hi ${name}, Invoice #${number} for ${amount} is due on ${date}. - ${company}`;

// ❌ Avoid long messages
const message = `Dear ${name}, this is a friendly reminder that your invoice...`;
```

### 4. Handle Errors Gracefully

Don't let SMS failures break your application:

```typescript
try {
  const result = await client.sendSMS(phone, message);
  
  if (result.success) {
    // Update database with message SID
    await updateReminder({ externalId: result.messageSid });
  } else {
    // Log error but continue
    console.error('SMS failed:', result.error);
  }
} catch (error) {
  // Handle exceptions
  console.error('Unexpected error:', error);
}
```

### 5. Store Message SIDs

Always store the Twilio message SID for tracking:

```typescript
const result = await client.sendSMS(phone, message);

if (result.success) {
  await db.update('reminders', {
    externalId: result.messageSid,
    status: 'in_progress',
  });
}
```

## Testing

The client includes comprehensive unit tests. Run them with:

```bash
npm test -- twilio-client.test.ts --run
```

### Test Coverage

- ✅ Configuration validation
- ✅ Phone number validation
- ✅ Message content validation
- ✅ Successful SMS sending
- ✅ API error handling
- ✅ Rate limiting
- ✅ Network errors
- ✅ Message status queries
- ✅ Singleton pattern

## Environment Variables

Required environment variables:

```bash
# Twilio Account SID (starts with AC)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio Auth Token
TWILIO_AUTH_TOKEN=your_auth_token_here

# Twilio phone number in E.164 format
TWILIO_PHONE_NUMBER=+1234567890
```

Optional for webhook validation:

```bash
# Webhook secret for signature validation
TWILIO_WEBHOOK_SECRET=your_webhook_secret_here
```

## Troubleshooting

### "TWILIO_ACCOUNT_SID is required"

Make sure you've set the environment variable:

```bash
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### "Invalid phone number format"

Ensure phone numbers are in E.164 format with a `+` prefix:

```typescript
// ✅ Correct
await client.sendSMS('+1234567890', 'Test');

// ❌ Wrong
await client.sendSMS('1234567890', 'Test');
```

### Rate Limiting

If you're hitting rate limits, implement exponential backoff:

```typescript
async function sendWithRetry(phone: string, message: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.sendSMS(phone, message);
    } catch (error) {
      if (error instanceof TwilioRateLimitError && i < maxRetries - 1) {
        const delay = (error.retryAfter || 60) * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

## Related Documentation

- [Twilio REST API Documentation](https://www.twilio.com/docs/sms/api)
- [E.164 Phone Number Format](https://www.twilio.com/docs/glossary/what-e164)
- [SMS Best Practices](https://www.twilio.com/docs/sms/best-practices)
