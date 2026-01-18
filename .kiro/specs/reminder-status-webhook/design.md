# Design Document

## Overview

This feature implements a webhook-based system for tracking payment reminder call status. Instead of marking reminders as completed immediately after room creation, the system now waits for the Python agent to report actual call outcomes via webhook callbacks. This provides accurate tracking of call lifecycle states and enables proper retry logic based on real outcomes.

## Architecture

The system follows an event-driven architecture where the Python agent reports call events to the backend:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Cron Scheduler │────────▶│  Call Executor   │────────▶│  LiveKit Room   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │                             │
                                     │                             ▼
                                     │                    ┌─────────────────┐
                                     │                    │  Python Agent   │
                                     │                    └─────────────────┘
                                     │                             │
                                     │                             │ Webhook
                                     │                             │ Callbacks
                                     │                             ▼
                                     │                    ┌─────────────────┐
                                     └───────────────────▶│ Webhook Handler │
                                                          └─────────────────┘
                                                                   │
                                                                   ▼
                                                          ┌─────────────────┐
                                                          │    Database     │
                                                          └─────────────────┘
```

## Components and Interfaces

### 1. Webhook Endpoint (`/api/webhooks/call-status`)

**Purpose:** Receives call status updates from the Python agent

**Request Interface:**
```typescript
interface WebhookRequest {
  reminder_id: string;
  event_type: 'call_answered' | 'call_completed' | 'call_failed';
  outcome?: {
    connected: boolean;
    duration: number;
    customer_response: 'will_pay_today' | 'already_paid' | 'dispute' | 'no_answer';
    notes?: string;
  };
  auth_token: string;
}
```

**Response Interface:**
```typescript
interface WebhookResponse {
  success: boolean;
  message: string;
}
```

**Authentication:** Uses `WEBHOOK_SECRET` environment variable for HMAC-based authentication

### 2. Status Update Handler

**Purpose:** Processes webhook events and updates reminder status

**Function Signature:**
```typescript
async function handleStatusUpdate(
  reminderId: string,
  eventType: string,
  outcome?: CallOutcome
): Promise<void>
```

**Status Transitions:**
- `call_answered` → status: `'processing'`
- `call_completed` → status: `'completed'` or `'pending'` (if no_answer)
- `call_failed` → status: `'failed'`

### 3. Timeout Monitor

**Purpose:** Detects and handles reminders stuck in `'in_progress'` state

**Function Signature:**
```typescript
async function checkTimeouts(): Promise<void>
```

**Behavior:**
- Runs during each cron execution
- Finds reminders in `'in_progress'` for > 10 minutes
- Marks them as `'failed'` with skip_reason: `'Call timeout - no agent response'`

### 4. Modified Call Executor

**Changes:**
- Remove immediate `handleCallOutcome` call after `initiateCall`
- Set status to `'in_progress'` and wait for webhook
- Timeout monitor will catch stuck reminders

## Data Models

### Updated Reminder Status Flow

```
pending → in_progress → processing → completed
                    │              └─→ pending (retry)
                    └─→ failed (timeout or error)
```

### Call Outcome Storage

The `call_outcome` JSON field stores:
```typescript
{
  connected: boolean;
  duration: number;
  customer_response: string;
  notes?: string;
  reported_at: string; // ISO timestamp when webhook received
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Enforcement
*For any* webhook request, if the auth_token is invalid, then the system should return 401 unauthorized
**Validates: Requirements 1.1, 1.5**

### Property 2: Valid Requests Update Database
*For any* valid webhook request with a valid reminder_id, the corresponding reminder record should be updated in the database
**Validates: Requirements 1.2**

### Property 3: Invalid Reminder IDs Return 404
*For any* webhook request with a non-existent reminder_id, the system should return 404 not found
**Validates: Requirements 1.3, 5.2**

### Property 4: Successful Processing Returns 200
*For any* valid and authenticated webhook request, the system should return 200 success
**Validates: Requirements 1.4**

### Property 5: Status Transition to Processing
*For any* reminder in 'in_progress' state, receiving a 'call_answered' event should transition the status to 'processing'
**Validates: Requirements 2.2**

### Property 6: Status Transition to Completed
*For any* reminder in 'processing' state, receiving a 'call_completed' event with connected=true should transition the status to 'completed'
**Validates: Requirements 2.3**

### Property 7: Status Transition to Failed
*For any* reminder, receiving a 'call_failed' event should transition the status to 'failed'
**Validates: Requirements 2.4**

### Property 8: No Answer Triggers Retry
*For any* reminder receiving a 'call_completed' event with customer_response='no_answer', the status should transition to 'pending' for retry
**Validates: Requirements 2.5**

### Property 9: Outcome Data Persistence
*For any* webhook request containing outcome data, all outcome fields (connected, duration, customer_response, notes) should be stored in the reminder's call_outcome field
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 10: Timestamp Updates
*For any* completed call, the last_attempt_at timestamp should be updated to within 1 second of the current time
**Validates: Requirements 3.5**

### Property 11: Error Handling Robustness
*For any* invalid webhook request, the endpoint should return an appropriate error code (400, 401, 404) without crashing
**Validates: Requirements 5.1, 5.3**

### Property 12: Timeout Detection
*For any* reminder in 'in_progress' state for more than 10 minutes, the timeout monitor should mark it as 'failed'
**Validates: Requirements 6.1**

### Property 13: Timeout Reason Recording
*For any* reminder marked as failed due to timeout, the skip_reason field should be set to 'Call timeout - no agent response'
**Validates: Requirements 6.2**

### Property 14: Timed-out Reminders Can Retry
*For any* reminder marked as failed due to timeout, the scheduleRetry function should still be able to schedule a retry
**Validates: Requirements 6.5**

## Error Handling

### Webhook Errors

1. **Invalid Auth Token** → 401 Unauthorized
2. **Missing Required Fields** → 400 Bad Request
3. **Invalid Reminder ID** → 404 Not Found
4. **Database Errors** → 500 Internal Server Error (logged, doesn't crash)

### Agent-Side Retry Logic

The Python agent should implement exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay
- After 3 failures: Log error for manual investigation

### Timeout Handling

- Timeout threshold: 10 minutes
- Checked during each cron run
- Timed-out reminders marked as 'failed' but can still be retried
- Logs generated for monitoring

## Testing Strategy

### Unit Tests

- Test webhook authentication with valid/invalid tokens
- Test status transitions for each event type
- Test error responses for invalid inputs
- Test timeout detection logic
- Test outcome data storage

### Property-Based Tests

- Generate random webhook requests and verify authentication
- Generate random reminder states and verify correct status transitions
- Generate random outcome data and verify complete storage
- Generate random timeout scenarios and verify correct handling

### Integration Tests

- End-to-end test: Create reminder → dispatch call → receive webhook → verify status
- Test Python agent webhook integration
- Test timeout monitor during cron execution
- Test retry scheduling after timeout

### Testing Configuration

- Minimum 100 iterations per property test
- Each property test tagged with: **Feature: reminder-status-webhook, Property {number}: {property_text}**
- Use fast-check (TypeScript) for property-based testing
- Mock LiveKit API calls in tests
- Use test database for integration tests

## Implementation Notes

### Environment Variables

```bash
WEBHOOK_SECRET=<random-secret-key>  # For webhook authentication
```

### Database Schema Changes

No schema changes required. Existing fields are sufficient:
- `status` field supports all needed states
- `call_outcome` JSON field stores outcome data
- `skip_reason` field stores timeout messages
- `last_attempt_at` timestamp tracks attempts

### Python Agent Changes

The agent needs to:
1. Extract `reminder_id` from room metadata
2. Call webhook at key events (answered, completed, failed)
3. Include authentication token in requests
4. Implement retry logic with exponential backoff
