# Implementation Plan: Reminder Status Webhook

## Overview

This plan implements webhook-based status tracking for payment reminder calls. The implementation focuses on creating a webhook endpoint, updating the call executor to use the new flow, implementing timeout monitoring, and integrating with the Python agent.

## Tasks

- [x] 1. Create webhook endpoint and authentication
  - Create `/api/webhooks/call-status/route.ts` endpoint
  - Implement HMAC-based authentication using WEBHOOK_SECRET
  - Add request validation for required fields
  - Return appropriate error codes (400, 401, 404, 500)
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 5.1_

- [ ]* 1.1 Write property test for webhook authentication
  - **Property 1: Authentication Enforcement**
  - **Validates: Requirements 1.1, 1.5**

- [ ]* 1.2 Write property test for invalid reminder IDs
  - **Property 3: Invalid Reminder IDs Return 404**
  - **Validates: Requirements 1.3, 5.2**

- [x] 2. Implement status update handler
  - Create `handleStatusUpdate` function in webhook route
  - Implement status transitions based on event_type
  - Handle 'call_answered' → 'processing' transition
  - Handle 'call_completed' → 'completed' or 'pending' transition
  - Handle 'call_failed' → 'failed' transition
  - Store call outcome data in database
  - Update last_attempt_at timestamp
  - _Requirements: 1.2, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 2.1 Write property tests for status transitions
  - **Property 5: Status Transition to Processing**
  - **Property 6: Status Transition to Completed**
  - **Property 7: Status Transition to Failed**
  - **Property 8: No Answer Triggers Retry**
  - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [ ]* 2.2 Write property test for outcome data persistence
  - **Property 9: Outcome Data Persistence**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ]* 2.3 Write property test for timestamp updates
  - **Property 10: Timestamp Updates**
  - **Validates: Requirements 3.5**

- [x] 3. Update call executor to use webhook flow
  - Modify `queueCall` in `reminder-scheduler.ts` to only set status to 'in_progress'
  - Remove immediate `handleCallOutcome` call after `initiateCall`
  - Keep error handling for room creation failures
  - _Requirements: 2.1_

- [x] 4. Implement timeout monitoring
  - Create `checkTimeouts` function in new file `lib/payment-reminders/timeout-monitor.ts`
  - Query for reminders in 'in_progress' state older than 10 minutes
  - Mark timed-out reminders as 'failed' with appropriate skip_reason
  - Log timeout events for monitoring
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 4.1 Write property test for timeout detection
  - **Property 12: Timeout Detection**
  - **Validates: Requirements 6.1**

- [ ]* 4.2 Write property test for timeout reason recording
  - **Property 13: Timeout Reason Recording**
  - **Validates: Requirements 6.2**

- [ ]* 4.3 Write property test for retry after timeout
  - **Property 14: Timed-out Reminders Can Retry**
  - **Validates: Requirements 6.5**

- [x] 5. Integrate timeout monitor with cron job
  - Update `/api/cron/process-reminders/route.ts` to call `checkTimeouts`
  - Run timeout check before processing new reminders
  - Log timeout check results
  - _Requirements: 6.4_

- [x] 6. Update Python agent to call webhook
  - Add webhook URL configuration to agent environment
  - Extract reminder_id from room metadata
  - Implement webhook client with authentication
  - Call webhook on 'call_answered' event
  - Call webhook on 'call_completed' event with outcome data
  - Call webhook on 'call_failed' event
  - Implement retry logic with exponential backoff (3 attempts)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.4, 5.5_

- [ ]* 6.1 Write unit tests for Python agent webhook integration
  - Test webhook client authentication
  - Test event payload formatting
  - Test retry logic with exponential backoff
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.4, 5.5_

- [x] 7. Add environment variable configuration
  - Add WEBHOOK_SECRET to `.env.example`
  - Document webhook configuration in README
  - Add WEBHOOK_URL to Python agent configuration
  - _Requirements: 1.1_

- [ ] 8. Checkpoint - Test end-to-end flow
  - Ensure all tests pass
  - Test complete flow: schedule → dispatch → webhook → status update
  - Verify timeout monitoring works correctly
  - Ask the user if questions arise

- [ ]* 9. Write integration tests
  - Test complete reminder lifecycle with webhook callbacks
  - Test timeout scenario end-to-end
  - Test retry scheduling after no_answer
  - Test error handling for various failure scenarios
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoint ensures incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
