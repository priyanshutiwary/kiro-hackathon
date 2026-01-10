# Call Executor Module

## Overview

The Call Executor module handles the execution of payment reminder calls. It orchestrates the complete call flow from pre-call verification through call initiation, outcome tracking, and retry scheduling.

## Key Functions

### `initiateCall(reminderId: string): Promise<CallOutcome>`

Initiates a call for a payment reminder.

**Flow:**
1. Fetches reminder and invoice from database
2. Validates customer phone number exists
3. Verifies invoice status via Zoho Books API
4. Checks if call should proceed (skips if paid)
5. Prepares fresh context with latest invoice data
6. Makes call via LiveKit
7. Returns call outcome

**Requirements:** 7.1, 7.2, 7.3, 8.1, 8.2

**Example:**
```typescript
import { initiateCall } from './call-executor';

const outcome = await initiateCall('reminder-123');
console.log('Call connected:', outcome.connected);
console.log('Customer response:', outcome.customerResponse);
```

### `handleCallOutcome(reminderId: string, outcome: CallOutcome): Promise<void>`

Handles the outcome of a call attempt.

**Flow:**
1. Fetches reminder from database
2. Determines new status based on outcome
3. Records call outcome data
4. Handles customer responses:
   - `will_pay_today`: Marks as completed
   - `already_paid`: Triggers verification and cancels future reminders
   - `dispute`: Marks as completed
   - `no_answer`: Keeps as pending for retry
5. Updates reminder in database

**Requirements:** 8.3, 8.4, 8.5, 8.6

**Example:**
```typescript
import { handleCallOutcome } from './call-executor';

const outcome = {
  connected: true,
  duration: 120,
  customerResponse: 'will_pay_today',
  notes: 'Customer committed to paying by end of day',
  livekitCallId: 'call-456'
};

await handleCallOutcome('reminder-123', outcome);
```

### `scheduleRetry(reminderId: string): Promise<void>`

Schedules a retry for a failed call attempt.

**Flow:**
1. Fetches reminder from database
2. Gets user settings for max retry attempts and delay
3. Checks if retry attempts remaining
4. If max attempts reached: marks as failed
5. If attempts remaining: calculates next retry time and updates reminder

**Requirements:** 8.6, 8.7, 8.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6

**Example:**
```typescript
import { scheduleRetry } from './call-executor';

// Schedule retry after failed call
await scheduleRetry('reminder-123');
```

## Internal Helper Functions

### `verifyAndCancelIfPaid(invoiceId: string, userId: string): Promise<void>`

Verifies invoice status and cancels future reminders if paid.

Called when customer claims they already paid to immediately verify and cancel unnecessary reminders.

### `getOrganizationId(userId: string): Promise<string>`

Gets the Zoho organization ID for a user from their reminder settings.

## Status Transitions

The Call Executor manages reminder status transitions:

```
pending → queued → in_progress → completed
                                → failed (after max retries)
                                → skipped (if invoice paid)
```

## Error Handling

All functions throw errors for:
- Reminder not found
- Invoice not found
- Missing customer phone number
- Missing organization ID
- Missing user settings

Callers should handle these errors appropriately.

## Integration Points

### Pre-Call Verification
- Uses `verifyInvoiceStatus()` to check invoice status before calling
- Uses `prepareFreshContext()` to build call context with latest data

### LiveKit Client
- Uses `makeCall()` to initiate outbound calls
- Receives `CallOutcome` with connection status and customer response

### Database
- Reads from: `paymentReminders`, `invoicesCache`, `reminderSettings`
- Writes to: `paymentReminders` (status, outcome, retry scheduling)

## Usage Example

Complete flow for processing a reminder:

```typescript
import { initiateCall, handleCallOutcome, scheduleRetry } from './call-executor';

async function processReminder(reminderId: string) {
  try {
    // Initiate the call
    const outcome = await initiateCall(reminderId);
    
    // Handle the outcome
    await handleCallOutcome(reminderId, outcome);
    
    // If call failed to connect, schedule retry
    if (!outcome.connected) {
      await scheduleRetry(reminderId);
    }
    
    console.log('Reminder processed successfully');
  } catch (error) {
    console.error('Error processing reminder:', error);
    // Handle error appropriately
  }
}
```

## Testing

The Call Executor should be tested with:

1. **Unit Tests:**
   - Test status determination logic
   - Test retry limit enforcement
   - Test error handling

2. **Integration Tests:**
   - Test complete call flow
   - Test retry scheduling
   - Test invoice verification and cancellation

3. **Property-Based Tests:**
   - Property 9: Retry Limit Enforcement
   - Property 12: Reminder Status Transitions

## Configuration

The Call Executor uses user-specific settings from `reminderSettings`:
- `maxRetryAttempts`: Maximum number of retry attempts (default: 3)
- `retryDelayHours`: Hours to wait between retries (default: 2)
- `organizationId`: Zoho organization ID for API calls

## Future Enhancements

Potential improvements:
1. Add exponential backoff for retries
2. Add call outcome analytics
3. Add webhook notifications for call outcomes
4. Add support for scheduled callbacks
5. Add support for custom retry strategies per reminder type
