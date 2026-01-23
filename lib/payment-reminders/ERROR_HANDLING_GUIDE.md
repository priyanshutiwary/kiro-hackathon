# Error Handling and Logging Guide

## Overview

This document describes the comprehensive error handling and logging strategy implemented for the SMS reminder system. The implementation follows security best practices by protecting PII (Personally Identifiable Information) while providing detailed context for debugging.

## Key Principles

### 1. PII Protection
- **Never log full phone numbers** - Always mask phone numbers showing only last 4 digits
- **Never log message content** - Only log message length
- **Never log customer names** - Use customer IDs instead
- Format: `+******7890` instead of `+1234567890`

### 2. Error Classification
Errors are classified into categories that determine retry behavior:

#### Non-Retryable Errors (Permanent Failures)
- Invalid phone numbers (missing, malformed, or Twilio error codes 21211, 21612, 21614, 30003-30006)
- Customer phone number missing from database
- These errors mark reminders as `failed` without scheduling retries

#### Retryable Errors (Temporary Failures)
- Network errors
- Twilio API errors (except invalid phone numbers)
- Rate limiting errors
- Configuration errors (missing Twilio credentials)
- These errors mark reminders as `pending` and schedule retries

### 3. Structured Logging
All log messages follow a consistent format:
```
[Component] Action - Context
```

Examples:
- `[Twilio Client] Sending SMS to +******7890`
- `[SMS Executor] SMS sent successfully. Message SID: SM123`
- `[Twilio Webhook] Processing status update - SID: SM123, Status: delivered, To: +******7890`

## Error Handling by Component

### Twilio Client (`twilio-client.ts`)

#### Phone Number Validation
```typescript
// Invalid phone number format - don't retry
if (!to.match(/^\+[1-9]\d{1,14}$/)) {
  return {
    success: false,
    error: `INVALID_PHONE_NUMBER: Invalid recipient phone number format`,
  };
}
```

**Logging:**
- Error: `[Twilio Client] Invalid recipient phone number format. Must be in E.164 format - phone: +******7890`
- No retry scheduled

#### Twilio API Errors
```typescript
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
  return {
    success: false,
    error: `INVALID_PHONE_NUMBER: ${errorMessage} (code: ${errorCode})`,
  };
}
```

**Logging:**
- Error: `[Twilio Client] API error 21211: Invalid phone number - phone: +******7890`
- Error: `[Twilio Client] Non-retryable error 21211 - marking as permanent failure`

#### Rate Limiting
```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  const retrySeconds = retryAfter ? parseInt(retryAfter) : 60;
  throw new TwilioRateLimitError(retrySeconds);
}
```

**Logging:**
- Warning: `[Twilio Client] Rate limit exceeded. Retry after 60 seconds`
- Error: `[Twilio Client] Error sending SMS to +******7890: TwilioRateLimitError`

#### Network Errors
```typescript
if (error instanceof Error) {
  return {
    success: false,
    error: `NETWORK_ERROR: ${error.message}`,
  };
}
```

**Logging:**
- Error: `[Twilio Client] Network error: Connection timeout`
- Error: `[Twilio Client] Error sending SMS to +******7890: Error: Connection timeout`

### SMS Executor (`sms-executor.ts`)

#### Missing Phone Number
```typescript
if (!customer.primaryPhone) {
  const error = 'Customer phone number missing';
  console.error(`[SMS Executor] ${error} - marking as permanent failure (no retry)`);
  
  await db.update(paymentReminders).set({
    status: 'failed',
    skipReason: error,
    lastAttemptAt: new Date(),
    attemptCount: reminder.attemptCount + 1,
  });
  
  return { success: false, error };
}
```

**Logging:**
- Error: `[SMS Executor] Customer phone number missing - marking as permanent failure (no retry)`
- No retry scheduled

#### Twilio Client Not Configured
```typescript
if (!twilioClient) {
  const error = 'Twilio client not configured';
  console.error(`[SMS Executor] ${error} - scheduling retry`);
  
  await db.update(paymentReminders).set({
    status: 'pending',
    skipReason: error,
  });
  
  await scheduleRetry(reminderId);
  return { success: false, error };
}
```

**Logging:**
- Error: `[SMS Executor] Twilio client not configured - scheduling retry`
- Retry scheduled

#### Rate Limiting Handling
```typescript
if (twilioError instanceof TwilioRateLimitError) {
  const error = `Rate limit exceeded. Retry after ${twilioError.retryAfter || 60} seconds`;
  console.warn(`[SMS Executor] ${error} - scheduling retry with backoff`);
  
  await db.update(paymentReminders).set({
    status: 'pending',
    skipReason: error,
  });
  
  await scheduleRetry(reminderId);
  return { success: false, error };
}
```

**Logging:**
- Warning: `[SMS Executor] Rate limit exceeded. Retry after 60 seconds - scheduling retry with backoff`
- Retry scheduled with exponential backoff

#### Twilio API Errors
```typescript
if (twilioError instanceof TwilioAPIError) {
  const error = `Twilio API error: ${twilioError.message}`;
  console.error(`[SMS Executor] ${error} - scheduling retry`);
  
  await db.update(paymentReminders).set({
    status: 'pending',
    skipReason: error,
  });
  
  await scheduleRetry(reminderId);
  return { success: false, error };
}
```

**Logging:**
- Error: `[SMS Executor] Twilio API error: Service unavailable - scheduling retry`
- Retry scheduled

#### Retry Decision Logic
```typescript
function shouldRetryError(error: string): boolean {
  const noRetryPrefixes = [
    'INVALID_PHONE_NUMBER',
    'Customer phone number missing',
  ];
  
  return !noRetryPrefixes.some(prefix => error.startsWith(prefix));
}
```

### Twilio Webhook (`app/api/webhooks/twilio/status/route.ts`)

#### Signature Validation
```typescript
if (!validateTwilioSignature(url, params, signature, webhookSecret)) {
  console.error('[Twilio Webhook] Invalid signature - potential security issue');
  return NextResponse.json(
    { success: false, message: 'Invalid signature' },
    { status: 401 }
  );
}
```

**Logging:**
- Error: `[Twilio Webhook] Invalid signature - potential security issue`
- Returns 401 Unauthorized

#### Reminder Not Found
```typescript
if (reminders.length === 0) {
  console.warn(`[Twilio Webhook] Reminder not found for message SID: ${MessageSid} - may have been deleted`);
  return NextResponse.json(
    { success: false, message: 'Reminder not found' },
    { status: 404 }
  );
}
```

**Logging:**
- Warning: `[Twilio Webhook] Reminder not found for message SID: SM123 - may have been deleted`
- Returns 404 Not Found

#### Delivery Failure
```typescript
if (newStatus === 'failed' && (ErrorCode || ErrorMessage)) {
  const errorInfo = {
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    reportedAt: now.toISOString(),
  };
  updateData.skipReason = JSON.stringify(errorInfo);
  console.error(`[Twilio Webhook] Delivery failed - Code: ${ErrorCode}, Message: ${ErrorMessage}`);
}
```

**Logging:**
- Error: `[Twilio Webhook] Delivery failed - Code: 30003, Message: Unreachable destination handset`
- Stores error details in database

#### Processing Time Tracking
```typescript
const startTime = Date.now();
// ... processing ...
const processingTime = Date.now() - startTime;
console.log(`[Twilio Webhook] Successfully updated reminder ${reminder.id} in ${processingTime}ms`);
```

**Logging:**
- Info: `[Twilio Webhook] Successfully updated reminder reminder_123 in 5ms`

#### Unexpected Errors
```typescript
catch (error) {
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
```

**Logging:**
- Error: `[Twilio Webhook] Error processing webhook after 15ms: { error: 'Database connection failed', stack: '...' }`
- Returns 500 Internal Server Error

## Error Codes and Prefixes

### Error Prefixes
All error messages use prefixes to indicate error type:

- `INVALID_PHONE_NUMBER:` - Phone number validation failed (no retry)
- `NETWORK_ERROR:` - Network connectivity issue (retry)
- `UNKNOWN_ERROR:` - Unexpected error (retry)
- `INVALID_MESSAGE:` - Message validation failed (no retry)

### Twilio Error Codes (No Retry)
- `21211` - Invalid 'To' phone number
- `21612` - Phone number not reachable via SMS
- `21614` - Not a valid mobile number
- `30003` - Unreachable destination handset
- `30004` - Message blocked
- `30005` - Unknown destination handset
- `30006` - Landline or unreachable carrier

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Error Rate by Type**
   - Track `INVALID_PHONE_NUMBER` errors (indicates data quality issues)
   - Track `NETWORK_ERROR` errors (indicates connectivity issues)
   - Track rate limit errors (indicates need for throttling)

2. **Retry Statistics**
   - Number of retries per reminder
   - Success rate after retry
   - Time to successful delivery

3. **Webhook Processing**
   - Processing time (should be < 100ms)
   - Signature validation failures (security concern)
   - 404 errors (reminders deleted before webhook received)

### Alert Thresholds

- **Critical:** > 10% of SMS sends failing with `INVALID_PHONE_NUMBER`
- **Warning:** > 5% rate limit errors
- **Warning:** Webhook processing time > 500ms
- **Critical:** > 3 signature validation failures in 1 hour

## Best Practices

### 1. Always Mask PII in Logs
```typescript
// ✅ Good
console.log(`[SMS Executor] Sending to ${maskPhoneNumber(phone)}`);

// ❌ Bad
console.log(`[SMS Executor] Sending to ${phone}`);
```

### 2. Provide Context in Error Messages
```typescript
// ✅ Good
console.error(`[Twilio Client] API error ${errorCode}: ${errorMessage} - phone: ${maskedPhone}`);

// ❌ Bad
console.error('Error sending SMS');
```

### 3. Use Appropriate Log Levels
- `console.log()` - Normal operations, success messages
- `console.warn()` - Recoverable issues, rate limiting
- `console.error()` - Failures, exceptions

### 4. Include Timing Information
```typescript
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
console.log(`[Component] Operation completed in ${duration}ms`);
```

### 5. Structure Error Objects
```typescript
// Store structured error information
const errorInfo = {
  errorCode: ErrorCode,
  errorMessage: ErrorMessage,
  reportedAt: new Date().toISOString(),
};
updateData.skipReason = JSON.stringify(errorInfo);
```

## Testing Error Handling

### Unit Tests
- Test invalid phone number handling
- Test rate limiting behavior
- Test network error handling
- Test retry logic
- Test PII masking

### Integration Tests
- Test end-to-end error flows
- Test webhook error handling
- Test retry scheduling
- Test permanent failure marking

### Manual Testing
- Trigger rate limits with Twilio
- Test with invalid phone numbers
- Test network failures
- Verify logs don't contain PII

## Troubleshooting Guide

### Issue: SMS not sending
1. Check logs for `[SMS Executor]` entries
2. Look for `INVALID_PHONE_NUMBER` errors (data quality issue)
3. Look for `Twilio client not configured` (configuration issue)
4. Check Twilio dashboard for API errors

### Issue: High failure rate
1. Check for `INVALID_PHONE_NUMBER` errors (indicates bad data)
2. Check for rate limit errors (need throttling)
3. Check Twilio error codes in webhook logs
4. Verify phone numbers are in E.164 format

### Issue: Webhooks not processing
1. Check for signature validation failures (security issue)
2. Check for 404 errors (timing issue - reminders deleted)
3. Check processing time (database performance)
4. Verify webhook URL configured in Twilio dashboard

## Security Considerations

1. **PII Protection:** All phone numbers are masked in logs
2. **Signature Validation:** All webhook requests are validated
3. **Error Information:** Error messages don't expose sensitive data
4. **Rate Limiting:** Handled gracefully with exponential backoff
5. **Audit Trail:** All operations logged with timestamps

## Future Enhancements

1. **Structured Logging:** Migrate to structured logging (JSON format)
2. **Distributed Tracing:** Add correlation IDs for request tracking
3. **Metrics Collection:** Export metrics to monitoring system
4. **Error Aggregation:** Group similar errors for easier analysis
5. **Automated Alerting:** Set up alerts based on error patterns
