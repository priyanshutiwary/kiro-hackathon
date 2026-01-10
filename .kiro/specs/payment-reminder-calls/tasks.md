# Implementation Plan: Payment Reminder Calls

## Overview

This implementation plan breaks down the Payment Reminder Call system into discrete, manageable tasks. The approach follows an incremental development strategy, building core infrastructure first, then adding sync capabilities, reminder scheduling, call execution, and finally the user interface.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create migration files for all tables (reminder_settings, invoices_cache, payment_reminders, sync_metadata)
  - Add indexes for performance optimization
  - Set up foreign key constraints and cascading deletes
  - _Requirements: 3.1, 4.7, 4.8, 5.3, 9.1, 11.1-11.4, 12.2_

- [ ]* 1.1 Write property test for database schema constraints
  - **Property 2: No Duplicate Invoices**
  - **Validates: Requirements 5.1, 5.3**

- [x] 2. Implement Settings Manager
  - [x] 2.1 Create ReminderSettings TypeScript interface and validation
    - Define complete ReminderSettings interface with all fields
    - Implement validation functions for timezone, time ranges, custom days
    - _Requirements: 1.1-1.13, 2.1-2.8, 11.1-11.6, 13.1-13.6_

  - [ ]* 2.2 Write unit tests for settings validation
    - Test invalid timezone rejection
    - Test invalid time range rejection
    - Test custom reminder days validation
    - _Requirements: 1.13, 11.5_

  - [x] 2.3 Implement getUserSettings and updateUserSettings functions
    - Create database queries for fetching and updating settings
    - Implement default settings for new users
    - _Requirements: 11.1, 11.5, 11.6_

  - [ ]* 2.4 Write property test for settings persistence
    - **Property 13: User Data Isolation**
    - **Validates: Requirements 12.3, 12.4, 12.5**

- [x] 3. Implement Zoho Books Client
  - [x] 3.1 Create ZohoInvoice interface and InvoiceFilters interface
    - Define TypeScript interfaces for Zoho API responses
    - Create filter interface for invoice queries
    - _Requirements: 16.7_

  - [x] 3.2 Implement getInvoices function with filtering
    - Implement API call to Zoho Books with status, date, and last_modified filters
    - Handle pagination if needed
    - Parse and transform Zoho response to ZohoInvoice format
    - _Requirements: 16.2, 16.3, 16.6_

  - [x] 3.3 Implement getInvoiceById function
    - Create single invoice fetch for pre-call verification
    - _Requirements: 7.1, 16.2_

  - [x] 3.4 Implement error handling and retry logic
    - Handle rate limits with exponential backoff
    - Handle authentication errors with token refresh
    - Handle network timeouts with retry
    - _Requirements: 16.4, 16.5_

  - [ ]* 3.5 Write unit tests for Zoho client error handling
    - Test rate limit handling
    - Test authentication failure handling
    - Test network timeout retry
    - _Requirements: 16.4, 16.5_

- [x] 4. Implement invoice hash calculation and change detection
  - [x] 4.1 Create calculateInvoiceHash function
    - Implement SHA-256 hash of relevant invoice fields
    - Include invoice_number, amounts, due_date, status, phone in hash
    - _Requirements: 4.1_

  - [ ]* 4.2 Write property test for hash consistency
    - **Property 10: Hash-Based Change Detection**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 4.3 Create detectChanges function
    - Compare existing invoice with Zoho invoice
    - Return InvoiceChanges object with flags for each change type
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.4 Write unit tests for change detection
    - Test due date change detection
    - Test amount change detection
    - Test status change detection
    - Test phone change detection
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [x] 5. Implement reminder schedule builder
  - [x] 5.1 Create buildReminderSchedule function
    - Generate reminder schedule based on user settings
    - Include standard reminders (30d, 15d, 7d, 5d, 3d, 1d, due, overdue)
    - Include custom reminder days from settings
    - Sort reminders chronologically
    - _Requirements: 1.1-1.12, 6.1, 6.2_

  - [ ]* 5.2 Write property test for future reminders only
    - **Property 4: Future Reminders Only**
    - **Validates: Requirements 6.2, 6.3**

  - [x] 5.3 Create getMaxReminderDays function
    - Calculate maximum reminder days from user settings
    - Used for sync window calculation
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ]* 5.4 Write property test for sync window consistency
    - **Property 1: Sync Window Consistency**
    - **Validates: Requirements 3.3, 3.4, 3.5**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Sync Engine core functions
  - [x] 7.1 Create processAndUpsertInvoice function
    - Calculate invoice hash
    - Check if invoice exists in cache
    - Insert new invoices or update existing invoices
    - Handle change detection and invoice updates
    - _Requirements: 3.1, 3.8, 4.1, 4.2, 5.1, 5.2, 5.4_

  - [ ]* 7.2 Write property test for no duplicate invoices
    - **Property 2: No Duplicate Invoices**
    - **Validates: Requirements 5.1, 5.3**

  - [x] 7.3 Create handleInvoiceChanges function
    - Handle status changes (cancel reminders if paid)
    - Handle due date changes (recreate reminders)
    - Handle amount changes (update cache)
    - Handle phone changes (update cache)
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [ ]* 7.4 Write property test for paid invoice reminder cancellation
    - **Property 5: Paid Invoice Reminder Cancellation**
    - **Validates: Requirements 4.3, 7.5**

  - [ ]* 7.5 Write property test for due date change reminder recreation
    - **Property 6: Due Date Change Triggers Reminder Recreation**
    - **Validates: Requirements 4.4**

  - [x] 7.6 Create createRemindersForInvoice function
    - Build reminder schedule for invoice
    - Filter to only future reminders
    - Insert reminder records
    - Mark invoice as reminders_created
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 7.7 Write property test for reminder creation idempotency
    - **Property 3: Reminder Creation Idempotency**
    - **Validates: Requirements 5.5, 6.4**

  - [x] 7.8 Create cleanupInvoicesOutsideWindow function
    - Find invoices outside sync window
    - Delete associated reminders
    - Delete invoices from cache
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8. Implement main sync function
  - [x] 8.1 Create syncInvoicesForUser function
    - Get user settings and sync metadata
    - Calculate sync window
    - Fetch invoices from Zoho (incremental)
    - Process and upsert each invoice
    - Cleanup invoices outside window
    - Update sync metadata
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 8.2 Write property test for incremental sync efficiency
    - **Property 11: Incremental Sync Efficiency**
    - **Validates: Requirements 3.8**

  - [x] 8.3 Create daily sync cron job
    - Set up cron job to run syncInvoicesForUser for all users
    - Implement error handling and logging
    - _Requirements: 3.1_

- [ ] 9. Checkpoint - Ensure sync tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement call window checking
  - [x] 10.1 Create getCurrentTimeInTimezone function
    - Convert current time to user's timezone
    - Use IANA timezone identifiers
    - _Requirements: 2.1, 2.7, 2.8_

  - [ ]* 10.2 Write unit tests for timezone conversion
    - Test various timezones
    - Test daylight saving time transitions
    - _Requirements: 2.7, 2.8_

  - [x] 10.3 Create canMakeCallNow function
    - Check if current time is within call window
    - Check if current day is allowed
    - Return CallWindowCheck result
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 10.4 Write property test for call window enforcement
    - **Property 8: Call Window Enforcement**
    - **Validates: Requirements 2.5, 2.6**

- [x] 11. Implement pre-call verification
  - [x] 11.1 Create verifyInvoiceStatus function
    - Fetch latest invoice data from Zoho
    - Check if invoice is paid
    - Return InvoiceVerification result
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 11.2 Write property test for pre-call verification
    - **Property 7: Pre-Call Verification Prevents Paid Invoice Calls**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 11.3 Create prepareFreshContext function
    - Build CallContext from verified invoice data
    - Calculate days until due or overdue
    - Include all required fields for voice agent
    - _Requirements: 7.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_

  - [ ]* 11.4 Write property test for fresh context preparation
    - **Property 14: Fresh Context Preparation**
    - **Validates: Requirements 7.6, 14.1-14.9**

- [x] 12. Implement LiveKit Client
  - [x] 12.1 Create CallContext and CallOutcome interfaces
    - Define TypeScript interfaces for call data
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 12.2 Implement makeCall function
    - Build agent prompt with invoice context
    - Initiate call via LiveKit API
    - Parse and return call outcome
    - _Requirements: 8.1, 8.2, 17.1, 17.2, 17.3_

  - [x] 12.3 Implement error handling for LiveKit
    - Handle call initiation failures
    - Handle invalid phone numbers
    - Handle network timeouts
    - _Requirements: 17.4, 17.5_

  - [ ]* 12.4 Write unit tests for LiveKit error handling
    - Test call initiation failure handling
    - Test invalid phone number handling
    - Test network timeout retry
    - _Requirements: 17.4_

- [x] 13. Implement Call Executor
  - [x] 13.1 Create initiateCall function
    - Verify invoice status
    - Check if should proceed
    - Prepare fresh context
    - Make call via LiveKit
    - Return call outcome
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2_

  - [x] 13.2 Create handleCallOutcome function
    - Update reminder status based on outcome
    - Record call outcome data
    - Handle customer responses (will_pay_today, already_paid, dispute, no_answer)
    - Trigger immediate verification if customer says already_paid
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

  - [x] 13.3 Create scheduleRetry function
    - Check if retry attempts remaining
    - Calculate next retry time
    - Update reminder for retry
    - _Requirements: 8.6, 8.7, 8.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 13.4 Write property test for retry limit enforcement
    - **Property 9: Retry Limit Enforcement**
    - **Validates: Requirements 8.7, 13.4**

- [x] 14. Implement Reminder Scheduler
  - [x] 14.1 Create processReminders function
    - Query due reminders (scheduled_date <= today, status = pending)
    - For each reminder, check call window eligibility
    - Queue eligible reminders for calling
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 14.2 Create queueCall function
    - Update reminder status to queued
    - Initiate call via Call Executor
    - Handle call outcome
    - _Requirements: 15.5_

  - [x] 14.3 Create hourly scheduler cron job
    - Set up cron job to run processReminders every 30 minutes
    - Implement error handling and logging
    - _Requirements: 15.7_

  - [ ]* 14.4 Write property test for reminder status transitions
    - **Property 12: Reminder Status Transitions**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**

- [ ] 15. Checkpoint - Ensure reminder execution tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement Settings API endpoints
  - [x] 16.1 Create GET /api/reminder-settings endpoint
    - Fetch user's current settings
    - Return settings as JSON
    - _Requirements: 11.1, 11.2_

  - [x] 16.2 Create PUT /api/reminder-settings endpoint
    - Validate incoming settings
    - Update user settings in database
    - Return success response
    - _Requirements: 11.3, 11.5, 19.9_

  - [x] 16.3 Create GET /api/reminder-settings/timezones endpoint
    - Return list of supported IANA timezones
    - _Requirements: 2.7_

  - [ ]* 16.4 Write unit tests for settings API validation
    - Test invalid settings rejection
    - Test successful settings update
    - _Requirements: 11.5, 19.9_

- [x] 17. Implement Reminders API endpoints
  - [x] 17.1 Create GET /api/reminders endpoint
    - Fetch reminders for current user
    - Support filtering by date range and status
    - Return reminders with invoice details
    - _Requirements: 18.1, 18.2, 18.5, 18.6_

  - [x] 17.2 Create GET /api/reminders/stats endpoint
    - Calculate reminder success rates
    - Return statistics for dashboard
    - _Requirements: 18.3_

  - [x] 17.3 Create GET /api/invoices endpoint
    - Fetch invoices awaiting payment for current user
    - Return invoices with reminder status
    - _Requirements: 18.4_

- [ ] 18. Implement Settings UI
  - [x] 18.1 Create reminder settings page component
    - Build form with all settings fields
    - Implement checkboxes for standard reminders
    - Implement custom reminder days input
    - Implement timezone selector with search
    - Implement time pickers for call window
    - Implement day-of-week selector
    - Implement retry settings inputs
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [x] 18.2 Implement settings form validation
    - Validate all inputs before submission
    - Display validation errors to user
    - _Requirements: 19.8_

  - [x] 18.3 Implement settings save functionality
    - Call PUT /api/reminder-settings on form submit
    - Display success confirmation
    - Handle errors gracefully
    - _Requirements: 11.5, 19.9_

  - [ ]* 18.4 Write unit tests for settings UI validation
    - Test form validation logic
    - Test error display
    - _Requirements: 19.8_

- [x] 19. Implement Reminders Dashboard UI
  - [x] 19.1 Create reminders dashboard page component
    - Display upcoming reminders list
    - Display completed reminders with outcomes
    - Display reminder statistics
    - Display invoices awaiting payment
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 19.2 Implement reminder filtering
    - Add date range filter
    - Add status filter
    - Update display based on filters
    - _Requirements: 18.5, 18.6_

  - [x] 19.3 Implement call outcome display
    - Show call outcomes and customer responses
    - Display call duration and connection status
    - _Requirements: 18.7_

- [ ] 20. Implement logging and monitoring
  - [x] 20.1 Add logging to sync operations
    - Log sync start, completion, errors
    - Log invoices fetched, inserted, updated
    - _Requirements: 4.1_

  - [x] 20.2 Add logging to reminder operations
    - Log reminders processed, calls made
    - Log call outcomes and errors
    - _Requirements: 16.1_

  - [x] 20.3 Add error alerting
    - Alert on sync failures
    - Alert on repeated call failures
    - _Requirements: 4.1, 9.1_

- [x] 21. Final integration testing
  - [x] 21.1 Test complete sync flow
    - Verify invoices sync correctly
    - Verify reminders created correctly
    - Verify change detection works
    - _Requirements: 3.1-3.8, 4.1-4.8, 6.1-6.6_

  - [x] 21.2 Test complete reminder flow
    - Verify reminders scheduled correctly
    - Verify call window checking works
    - Verify pre-call verification works
    - Verify calls made successfully
    - Verify outcomes tracked correctly
    - _Requirements: 7.1-7.6, 8.1-8.8, 15.1-15.7_

  - [x] 21.3 Test settings update flow
    - Verify settings save correctly
    - Verify sync window adjusts
    - Verify future reminders respect new settings
    - _Requirements: 1.13, 11.5, 11.6_

  - [x] 21.4 Test multi-user isolation
    - Verify users can't access each other's data
    - Verify settings apply per user
    - _Requirements: 12.1-12.6_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
