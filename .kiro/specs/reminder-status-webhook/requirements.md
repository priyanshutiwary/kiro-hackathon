# Requirements Document

## Introduction

This feature implements webhook-based status tracking for payment reminder calls. Currently, reminders are marked as completed immediately after room creation, before the actual call outcome is known. This feature enables the Python agent to report real call outcomes (answered, no answer, completed) via webhook callbacks.

## Glossary

- **Reminder**: A scheduled payment reminder call record in the database
- **Webhook**: An HTTP endpoint that receives status updates from the Python agent
- **Call_Outcome**: The final result of a call attempt (answered, no_answer, completed, failed)
- **Python_Agent**: The LiveKit agent that handles the actual phone call
- **Status**: The current state of a reminder (pending, in_progress, processing, completed, failed, skipped)

## Requirements

### Requirement 1: Webhook Endpoint

**User Story:** As a system, I want to receive call status updates from the Python agent, so that reminder records reflect actual call outcomes.

#### Acceptance Criteria

1. WHEN the webhook endpoint receives a valid request, THE System SHALL authenticate the request using a shared secret
2. WHEN the webhook receives a call status update, THE System SHALL update the corresponding reminder record
3. IF the webhook receives an invalid reminder ID, THEN THE System SHALL return a 404 error
4. WHEN the webhook processes a status update, THE System SHALL return a 200 success response
5. IF authentication fails, THEN THE System SHALL return a 401 unauthorized error

### Requirement 2: Status Progression

**User Story:** As a developer, I want reminders to progress through clear status states, so that I can track the call lifecycle accurately.

#### Acceptance Criteria

1. WHEN a reminder is queued for calling, THE System SHALL set status to 'in_progress'
2. WHEN the Python agent reports call answered, THE System SHALL set status to 'processing'
3. WHEN the Python agent reports call completed, THE System SHALL set status to 'completed'
4. WHEN the Python agent reports call failed, THE System SHALL set status to 'failed'
5. WHEN a call is not answered, THE System SHALL set status to 'pending' for retry

### Requirement 3: Call Outcome Recording

**User Story:** As a business owner, I want to see detailed call outcomes, so that I can understand customer interactions.

#### Acceptance Criteria

1. WHEN the webhook receives call outcome data, THE System SHALL store the outcome in the reminder record
2. WHEN storing call outcomes, THE System SHALL include customer response type (will_pay_today, already_paid, dispute, no_answer)
3. WHEN storing call outcomes, THE System SHALL include call duration in seconds
4. WHEN storing call outcomes, THE System SHALL include any notes from the agent
5. WHEN a call is completed, THE System SHALL update the last_attempt_at timestamp

### Requirement 4: Agent Integration

**User Story:** As a Python agent, I want to report call status updates, so that the backend tracks call progress accurately.

#### Acceptance Criteria

1. WHEN the agent answers a call, THE Agent SHALL send a webhook request with event_type 'call_answered'
2. WHEN the agent completes a call, THE Agent SHALL send a webhook request with event_type 'call_completed' and outcome data
3. WHEN a call fails to connect, THE Agent SHALL send a webhook request with event_type 'call_failed'
4. WHEN sending webhook requests, THE Agent SHALL include the reminder_id from room metadata
5. WHEN sending webhook requests, THE Agent SHALL include authentication credentials

### Requirement 5: Error Handling

**User Story:** As a system administrator, I want robust error handling, so that webhook failures don't break the system.

#### Acceptance Criteria

1. IF a webhook request fails validation, THEN THE System SHALL log the error and return appropriate error code
2. IF a reminder is not found, THEN THE System SHALL log the error and return 404
3. WHEN webhook processing fails, THE System SHALL not crash the endpoint
4. WHEN the agent cannot reach the webhook, THE Agent SHALL retry up to 3 times with exponential backoff
5. IF all webhook retries fail, THEN THE Agent SHALL log the failure for manual investigation

### Requirement 6: Timeout Handling

**User Story:** As a system, I want to handle cases where the agent never reports back, so that reminders don't stay in 'in_progress' forever.

#### Acceptance Criteria

1. WHEN a reminder has been 'in_progress' for more than 10 minutes, THE System SHALL mark it as 'failed'
2. WHEN marking timed-out reminders as failed, THE System SHALL set skip_reason to 'Call timeout - no agent response'
3. WHEN a timeout occurs, THE System SHALL log the timeout for monitoring
4. THE System SHALL check for timed-out reminders during each cron run
5. WHEN a timed-out reminder is marked failed, THE System SHALL still allow retry scheduling
