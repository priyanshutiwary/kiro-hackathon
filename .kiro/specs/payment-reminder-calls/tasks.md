# Implementation Plan: Payment Reminder Calls

## Overview

This implementation plan breaks down the Payment Reminder Call system into discrete, manageable tasks. The approach follows an incremental development strategy, building core infrastructure first, then adding sync capabilities, reminder scheduling, call execution, and finally the user interface.

## Tasks

- [ ] 1. Set up database schema and migrations
  - Create migration files for all tables (reminder_settings, bills_cache, payment_reminders, sync_metadata, holidays)
  - Add indexes for performance optimization
  - Set up foreign key constraints and cascading deletes
  - _Requirements: 4.1, 5.7, 5.8, 6.3, 10.1, 12.1-12.6, 13.2_

- [ ]* 1.1 Write property test for database schema constraints
  - **Property 2: No Duplicate Bills**
  - **Validates: Requirements 6.1, 6.3**

- [ ] 2. Implement Settings Manager
  - [ ] 2.1 Create ReminderSettings TypeScript interface and validation
    - Define complete ReminderSettings interface with all fields
    - Implement validation functions for timezone, time ranges, custom days
    - _Requirements: 1.1-1.13, 2.1-2.8, 3.1-3.5, 12.1-12.7, 14.1-14.6_

  - [ ]* 2.2 Write unit tests for settings validation
    - Test invalid timezone rejection
    - Test invalid time range rejection
    - Test custom reminder days validation
    - _Requirements: 1.13, 12.9_

  - [ ] 2.3 Implement getUserSettings and updateUserSettings functions
    - Create database queries for fetching and updating settings
    - Implement default settings for new users
    - _Requirements: 12.1, 12.6, 12.7_

  - [ ]* 2.4 Write property test for settings persistence
    - **Property 14: User Data Isolation**
    - **Validates: Requirements 13.3, 13.4, 13.5**

- [ ] 3. Implement Zoho Books Client
  - [ ] 3.1 Create ZohoBill interface and BillFilters interface
    - Define TypeScript interfaces for Zoho API responses
    - Create filter interface for bill queries
    - _Requirements: 17.7_

  - [ ] 3.2 Implement getBills function with filtering
    - Implement API call to Zoho Books with status, date, and last_modified filters
    - Handle pagination if needed
    - Parse and transform Zoho response to ZohoBill format
    - _Requirements: 17.2, 17.3, 17.6_

  - [ ] 3.3 Implement getBillById function
    - Create single bill fetch for pre-call verification
    - _Requirements: 8.1, 17.2_

  - [ ] 3.4 Implement error handling and retry logic
    - Handle rate limits with exponential backoff
    - Handle authentication errors with token refresh
    - Handle network timeouts with retry
    - _Requirements: 17.4, 17.5_

  - [ ]* 3.5 Write unit tests for Zoho client error handling
    - Test rate limit handling
    - Test authentication failure handling
    - Test network timeout retry
    - _Requirements: 17.4, 17.5_

- [ ] 4. Implement bill hash calculation and change detection
  - [ ] 4.1 Create calculateBillHash function
    - Implement SHA-256 hash of relevant bill fields
    - Include bill_number, amounts, due_date, status, phone in hash
    - _Requirements: 5.1_

  - [ ]* 4.2 Write property test for hash consistency
    - **Property 11: Hash-Based Change Detection**
    - **Validates: Requirements 5.1, 5.2**

  - [ ] 4.3 Create detectChanges function
    - Compare existing bill with Zoho bill
    - Return BillChanges object with flags for each change type
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.4 Write unit tests for change detection
    - Test due date change detection
    - Test amount change detection
    - Test status change detection
    - Test phone change detection
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ] 5. Implement reminder schedule builder
  - [ ] 5.1 Create buildReminderSchedule function
    - Generate reminder schedule based on user settings
    - Include standard reminders (30d, 15d, 7d, 5d, 3d, 1d, due, overdue)
    - Include custom reminder days from settings
    - Sort reminders chronologically
    - _Requirements: 1.1-1.12, 7.1, 7.2_

  - [ ]* 5.2 Write property test for future reminders only
    - **Property 4: Future Reminders Only**
    - **Validates: Requirements 7.2, 7.3**

  - [ ] 5.3 Create getMaxReminderDays function
    - Calculate maximum reminder days from user settings
    - Used for sync window calculation
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ]* 5.4 Write property test for sync window consistency
    - **Property 1: Sync Window Consistency**
    - **Validates: Requirements 4.3, 4.4, 4.5**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Sync Engine core functions
  - [ ] 7.1 Create processAndUpsertBill function
    - Calculate bill hash
    - Check if bill exists in cache
    - Insert new bills or update existing bills
    - Handle change detection and bill updates
    - _Requirements: 4.1, 4.8, 5.1, 5.2, 6.1, 6.2, 6.4_

  - [ ]* 7.2 Write property test for no duplicate bills
    - **Property 2: No Duplicate Bills**
    - **Validates: Requirements 6.1, 6.3**

  - [ ] 7.3 Create handleBillChanges function
    - Handle status changes (cancel reminders if paid)
    - Handle due date changes (recreate reminders)
    - Handle amount changes (update cache)
    - Handle phone changes (update cache)
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [ ]* 7.4 Write property test for paid bill reminder cancellation
    - **Property 5: Paid Bill Reminder Cancellation**
    - **Validates: Requirements 5.3, 8.5**

  - [ ]* 7.5 Write property test for due date change reminder recreation
    - **Property 6: Due Date Change Triggers Reminder Recreation**
    - **Validates: Requirements 5.4**

  - [ ] 7.6 Create createRemindersForBill function
    - Build reminder schedule for bill
    - Filter to only future reminders
    - Insert reminder records
    - Mark bill as reminders_created
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 7.7 Write property test for reminder creation idempotency
    - **Property 3: Reminder Creation Idempotency**
    - **Validates: Requirements 6.5, 7.4**

  - [ ] 7.8 Create cleanupBillsOutsideWindow function
    - Find bills outside sync window
    - Delete associated reminders
    - Delete bills from cache
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 8. Implement main sync function
  - [ ] 8.1 Create syncBillsForUser function
    - Get user settings and sync metadata
    - Calculate sync window
    - Fetch bills from Zoho (incremental)
    - Process and upsert each bill
    - Cleanup bills outside window
    - Update sync metadata
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 8.2 Write property test for incremental sync efficiency
    - **Property 12: Incremental Sync Efficiency**
    - **Validates: Requirements 4.8**

  - [ ] 8.3 Create daily sync cron job
    - Set up cron job to run syncBillsForUser for all users
    - Implement error handling and logging
    - _Requirements: 4.1_

- [ ] 9. Checkpoint - Ensure sync tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement call window checking
  - [ ] 10.1 Create getCurrentTimeInTimezone function
    - Convert current time to user's timezone
    - Use IANA timezone identifiers
    - _Requirements: 2.1, 2.7, 2.8_

  - [ ]* 10.2 Write unit tests for timezone conversion
    - Test various timezones
    - Test daylight saving time transitions
    - _Requirements: 2.7, 2.8_

  - [ ] 10.3 Create checkIfHoliday function
    - Query holidays table for date and country
    - Return whether date is a holiday
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 10.4 Create canMakeCallNow function
    - Check if current time is within call window
    - Check if current day is allowed
    - Check if date is a holiday (if enabled)
    - Return CallWindowCheck result
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.3_

  - [ ]* 10.5 Write property test for call window enforcement
    - **Property 8: Call Window Enforcement**
    - **Validates: Requirements 2.5, 2.6**

  - [ ]* 10.6 Write property test for holiday skipping
    - **Property 9: Holiday Skipping**
    - **Validates: Requirements 3.3**

- [ ] 11. Implement pre-call verification
  - [ ] 11.1 Create verifyBillStatus function
    - Fetch latest bill data from Zoho
    - Check if bill is paid
    - Return BillVerification result
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 11.2 Write property test for pre-call verification
    - **Property 7: Pre-Call Verification Prevents Paid Bill Calls**
    - **Validates: Requirements 8.2, 8.3**

  - [ ] 11.3 Create prepareFreshContext function
    - Build CallContext from verified bill data
    - Calculate days until due or overdue
    - Include all required fields for voice agent
    - _Requirements: 8.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

  - [ ]* 11.4 Write property test for fresh context preparation
    - **Property 15: Fresh Context Preparation**
    - **Validates: Requirements 8.6, 15.1-15.9**

- [ ] 12. Implement LiveKit Client
  - [ ] 12.1 Create CallContext and CallOutcome interfaces
    - Define TypeScript interfaces for call data
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [ ] 12.2 Implement makeCall function
    - Build agent prompt with bill context
    - Initiate call via LiveKit API
    - Parse and return call outcome
    - _Requirements: 9.1, 9.2, 18.1, 18.2, 18.3_

  - [ ] 12.3 Implement error handling for LiveKit
    - Handle call initiation failures
    - Handle invalid phone numbers
    - Handle network timeouts
    - _Requirements: 18.4, 18.5_

  - [ ]* 12.4 Write unit tests for LiveKit error handling
    - Test call initiation failure handling
    - Test invalid phone number handling
    - Test network timeout retry
    - _Requirements: 18.4_

- [ ] 13. Implement Call Executor
  - [ ] 13.1 Create initiateCall function
    - Verify bill status
    - Check if should proceed
    - Prepare fresh context
    - Make call via LiveKit
    - Return call outcome
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2_

  - [ ] 13.2 Create handleCallOutcome function
    - Update reminder status based on outcome
    - Record call outcome data
    - Handle customer responses (will_pay_today, already_paid, dispute, no_answer)
    - Trigger immediate verification if customer says already_paid
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

  - [ ] 13.3 Create scheduleRetry function
    - Check if retry attempts remaining
    - Calculate next retry time
    - Update reminder for retry
    - _Requirements: 9.6, 9.7, 9.8, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 13.4 Write property test for retry limit enforcement
    - **Property 10: Retry Limit Enforcement**
    - **Validates: Requirements 9.7, 14.4**

- [ ] 14. Implement Reminder Scheduler
  - [ ] 14.1 Create processReminders function
    - Query due reminders (scheduled_date <= today, status = pending)
    - For each reminder, check call window eligibility
    - Queue eligible reminders for calling
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [ ] 14.2 Create queueCall function
    - Update reminder status to queued
    - Initiate call via Call Executor
    - Handle call outcome
    - _Requirements: 16.5_

  - [ ] 14.3 Create hourly scheduler cron job
    - Set up cron job to run processReminders every 30 minutes
    - Implement error handling and logging
    - _Requirements: 16.7_

  - [ ]* 14.4 Write property test for reminder status transitions
    - **Property 13: Reminder Status Transitions**
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**

- [ ] 15. Checkpoint - Ensure reminder execution tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement Settings API endpoints
  - [ ] 16.1 Create GET /api/reminder-settings endpoint
    - Fetch user's current settings
    - Return settings as JSON
    - _Requirements: 12.1, 12.2_

  - [ ] 16.2 Create PUT /api/reminder-settings endpoint
    - Validate incoming settings
    - Update user settings in database
    - Return success response
    - _Requirements: 12.3, 12.6, 12.10_

  - [ ] 16.3 Create GET /api/reminder-settings/timezones endpoint
    - Return list of supported IANA timezones
    - _Requirements: 2.7_

  - [ ] 16.4 Create GET /api/reminder-settings/countries endpoint
    - Return list of supported countries with holiday calendars
    - _Requirements: 3.2, 3.4_

  - [ ]* 16.5 Write unit tests for settings API validation
    - Test invalid settings rejection
    - Test successful settings update
    - _Requirements: 12.9, 12.10_

- [ ] 17. Implement Reminders API endpoints
  - [ ] 17.1 Create GET /api/reminders endpoint
    - Fetch reminders for current user
    - Support filtering by date range and status
    - Return reminders with bill details
    - _Requirements: 19.1, 19.2, 19.5, 19.6_

  - [ ] 17.2 Create GET /api/reminders/stats endpoint
    - Calculate reminder success rates
    - Return statistics for dashboard
    - _Requirements: 19.3_

  - [ ] 17.3 Create GET /api/bills endpoint
    - Fetch bills awaiting payment for current user
    - Return bills with reminder status
    - _Requirements: 19.4_

- [ ] 18. Implement Settings UI
  - [ ] 18.1 Create reminder settings page component
    - Build form with all settings fields
    - Implement checkboxes for standard reminders
    - Implement custom reminder days input
    - Implement timezone selector with search
    - Implement time pickers for call window
    - Implement day-of-week selector
    - Implement country selector
    - Implement retry settings inputs
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

  - [ ] 18.2 Implement settings form validation
    - Validate all inputs before submission
    - Display validation errors to user
    - _Requirements: 20.9_

  - [ ] 18.3 Implement settings save functionality
    - Call PUT /api/reminder-settings on form submit
    - Display success confirmation
    - Handle errors gracefully
    - _Requirements: 12.6, 20.10_

  - [ ]* 18.4 Write unit tests for settings UI validation
    - Test form validation logic
    - Test error display
    - _Requirements: 20.9_

- [ ] 19. Implement Reminders Dashboard UI
  - [ ] 19.1 Create reminders dashboard page component
    - Display upcoming reminders list
    - Display completed reminders with outcomes
    - Display reminder statistics
    - Display bills awaiting payment
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [ ] 19.2 Implement reminder filtering
    - Add date range filter
    - Add status filter
    - Update display based on filters
    - _Requirements: 19.5, 19.6_

  - [ ] 19.3 Implement call outcome display
    - Show call outcomes and customer responses
    - Display call duration and connection status
    - _Requirements: 19.7_

- [ ] 20. Seed holiday calendar data
  - [ ] 20.1 Create holiday data for supported countries
    - Add holidays for India, US, UK
    - Include major national holidays
    - _Requirements: 3.4, 3.5_

  - [ ] 20.2 Create database seed script
    - Insert holiday data into holidays table
    - _Requirements: 3.4_

- [ ] 21. Implement logging and monitoring
  - [ ] 21.1 Add logging to sync operations
    - Log sync start, completion, errors
    - Log bills fetched, inserted, updated
    - _Requirements: 4.1_

  - [ ] 21.2 Add logging to reminder operations
    - Log reminders processed, calls made
    - Log call outcomes and errors
    - _Requirements: 16.1_

  - [ ] 21.3 Add error alerting
    - Alert on sync failures
    - Alert on repeated call failures
    - _Requirements: 4.1, 9.1_

- [ ] 22. Final integration testing
  - [ ] 22.1 Test complete sync flow
    - Verify bills sync correctly
    - Verify reminders created correctly
    - Verify change detection works
    - _Requirements: 4.1-4.8, 5.1-5.8, 7.1-7.6_

  - [ ] 22.2 Test complete reminder flow
    - Verify reminders scheduled correctly
    - Verify call window checking works
    - Verify pre-call verification works
    - Verify calls made successfully
    - Verify outcomes tracked correctly
    - _Requirements: 8.1-8.6, 9.1-9.8, 16.1-16.7_

  - [ ] 22.3 Test settings update flow
    - Verify settings save correctly
    - Verify sync window adjusts
    - Verify future reminders respect new settings
    - _Requirements: 1.13, 12.6, 12.7_

  - [ ] 22.4 Test multi-user isolation
    - Verify users can't access each other's data
    - Verify settings apply per user
    - _Requirements: 13.1-13.6_

- [ ] 23. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
