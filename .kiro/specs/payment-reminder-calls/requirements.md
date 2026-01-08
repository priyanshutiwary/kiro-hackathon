# Requirements Document

## Introduction

This document specifies the requirements for an automated payment reminder call system that integrates with Zoho Books to remind customers about upcoming and overdue bill payments via voice calls. The system provides users with full control over reminder schedules, call timing preferences, and timezone management while efficiently syncing bill data and detecting changes.

## Glossary

- **System**: The payment reminder call system
- **User**: The business owner or administrator configuring reminder settings
- **Customer**: The end recipient of payment reminder calls
- **Bill**: An unpaid or partially paid invoice from Zoho Books
- **Reminder**: A scheduled voice call to notify a customer about a payment
- **Sync_Window**: The time range (in days) for fetching bills based on user's reminder schedule
- **Call_Window**: The time range during which calls can be made based on user preferences
- **Zoho_Books**: The accounting software providing bill data
- **LiveKit_Agent**: The voice agent service that makes outbound calls
- **Pre_Call_Verification**: Real-time check of bill status before initiating a call
- **Incremental_Sync**: Fetching only new or modified bills since last sync
- **Change_Detection**: Identifying modifications to existing bills in Zoho Books

## Requirements

### Requirement 1: User Reminder Schedule Configuration

**User Story:** As a user, I want to configure when reminders are sent to customers, so that I can control the timing and frequency of payment reminder calls.

#### Acceptance Criteria

1. THE System SHALL provide options to enable reminders at 30 days before due date
2. THE System SHALL provide options to enable reminders at 15 days before due date
3. THE System SHALL provide options to enable reminders at 7 days before due date
4. THE System SHALL provide options to enable reminders at 5 days before due date
5. THE System SHALL provide options to enable reminders at 3 days before due date
6. THE System SHALL provide options to enable reminders at 1 day before due date
7. THE System SHALL provide options to enable reminders on the due date
8. THE System SHALL provide options to enable reminders at 1 day overdue
9. THE System SHALL provide options to enable reminders at 3 days overdue
10. THE System SHALL provide options to enable reminders at 7 days overdue
11. THE System SHALL allow users to enable or disable each reminder option independently
12. THE System SHALL support custom reminder days specified as positive or negative offsets from due date
13. WHEN a user updates reminder settings, THEN THE System SHALL apply changes to future reminders only

### Requirement 2: Call Timing and Timezone Management

**User Story:** As a user, I want to control when calls are made to customers, so that calls are made during appropriate business hours in the customer's timezone.

#### Acceptance Criteria

1. THE System SHALL allow users to select a timezone for call scheduling
2. THE System SHALL allow users to specify a call start time
3. THE System SHALL allow users to specify a call end time
4. THE System SHALL allow users to select which days of the week calls can be made
5. WHEN a reminder is due, THE System SHALL only initiate calls within the configured call window
6. WHEN the current time is outside the call window, THEN THE System SHALL wait until the next valid call time
7. THE System SHALL support all standard IANA timezone identifiers
8. THE System SHALL calculate call windows based on the user's selected timezone

### Requirement 3: Holiday and Business Day Management

**User Story:** As a user, I want to avoid calling customers on holidays, so that calls are made only on appropriate business days.

#### Acceptance Criteria

1. THE System SHALL allow users to enable or disable holiday skipping
2. THE System SHALL allow users to select a country for holiday calendar
3. WHEN holiday skipping is enabled and a reminder falls on a holiday, THEN THE System SHALL defer the call to the next business day
4. THE System SHALL maintain a holiday calendar for supported countries
5. THE System SHALL support holidays for India, United States, United Kingdom, and other major countries

### Requirement 4: Intelligent Bill Synchronization

**User Story:** As a system administrator, I want the system to efficiently sync bills from Zoho Books, so that only relevant bills are stored and API usage is minimized.

#### Acceptance Criteria

1. THE System SHALL perform daily synchronization of bills from Zoho Books
2. WHEN syncing bills, THE System SHALL fetch only bills within the sync window
3. THE System SHALL calculate the sync window based on the user's maximum enabled reminder days plus a buffer
4. WHEN a user enables 30-day reminders, THEN THE System SHALL fetch bills due within 35 days
5. WHEN a user enables 7-day reminders, THEN THE System SHALL fetch bills due within 12 days
6. THE System SHALL fetch bills with status unpaid or partially paid
7. THE System SHALL fetch all overdue bills regardless of sync window
8. THE System SHALL use Zoho's last modified timestamp to fetch only changed bills during incremental sync

### Requirement 5: Bill Change Detection and Handling

**User Story:** As a system administrator, I want the system to detect changes to bills in Zoho Books, so that reminders reflect the most current information.

#### Acceptance Criteria

1. THE System SHALL calculate a hash of bill data to detect changes
2. WHEN a bill's hash differs from the cached version, THEN THE System SHALL identify the bill as modified
3. WHEN a bill's status changes to paid, THEN THE System SHALL cancel all pending reminders for that bill
4. WHEN a bill's due date changes, THEN THE System SHALL delete existing reminders and create new reminders with updated dates
5. WHEN a bill's amount changes, THEN THE System SHALL update the cached amount
6. WHEN a bill's customer phone number changes, THEN THE System SHALL update the cached phone number
7. THE System SHALL track the last modified timestamp from Zoho Books for each bill
8. THE System SHALL track the local sync timestamp for each bill

### Requirement 6: Deduplication and Upsert Logic

**User Story:** As a system administrator, I want the system to avoid duplicate bill records, so that the database remains clean and efficient.

#### Acceptance Criteria

1. WHEN syncing a bill that already exists in the cache, THEN THE System SHALL update the existing record
2. WHEN syncing a new bill, THEN THE System SHALL insert a new record
3. THE System SHALL use the combination of user ID and Zoho bill ID as a unique constraint
4. WHEN a bill has no changes, THEN THE System SHALL only update the sync timestamp
5. THE System SHALL not create duplicate reminder records for the same bill and reminder type

### Requirement 7: Smart Reminder Creation

**User Story:** As a system administrator, I want reminders to be created only when relevant, so that the system doesn't create unnecessary reminder records.

#### Acceptance Criteria

1. WHEN a new bill enters the sync window, THEN THE System SHALL create reminders based on user settings
2. THE System SHALL only create reminders for dates that are in the future or today
3. WHEN a bill's due date is 5 days away and the user has 7-day reminders enabled, THEN THE System SHALL not create the 7-day reminder
4. THE System SHALL mark bills as having reminders created to prevent duplicate creation
5. WHEN reminders are created for a bill, THEN THE System SHALL set the reminders created flag to true
6. THE System SHALL create all applicable future reminders in a single operation

### Requirement 8: Pre-Call Verification

**User Story:** As a user, I want the system to verify bill status before making calls, so that customers are not called about bills they have already paid.

#### Acceptance Criteria

1. WHEN a reminder is due for calling, THEN THE System SHALL fetch the latest bill status from Zoho Books
2. WHEN the bill status is paid, THEN THE System SHALL skip the call and mark the reminder as skipped
3. WHEN the bill status is unpaid or partially paid, THEN THE System SHALL proceed with the call
4. THE System SHALL update the cached bill status after pre-call verification
5. THE System SHALL cancel all future reminders for a bill that is verified as paid
6. THE System SHALL prepare fresh bill data for the voice agent including current amount due

### Requirement 9: Call Execution and Outcome Tracking

**User Story:** As a user, I want the system to make calls and track outcomes, so that I can monitor reminder effectiveness and customer responses.

#### Acceptance Criteria

1. WHEN pre-call verification passes, THEN THE System SHALL initiate a call via LiveKit Agent
2. THE System SHALL provide the voice agent with bill details including customer name, bill number, amount due, and due date
3. THE System SHALL track whether the call was connected or failed
4. THE System SHALL track call duration
5. THE System SHALL track customer response categories including will pay today, already paid, dispute, and no answer
6. WHEN a call fails to connect, THEN THE System SHALL schedule a retry
7. THE System SHALL limit retry attempts to the user-configured maximum
8. THE System SHALL wait the user-configured delay hours between retry attempts

### Requirement 10: Reminder Status Management

**User Story:** As a system administrator, I want the system to track reminder status, so that reminders are processed correctly and not duplicated.

#### Acceptance Criteria

1. THE System SHALL support reminder statuses including pending, queued, in progress, completed, skipped, and failed
2. WHEN a reminder is scheduled, THEN THE System SHALL set status to pending
3. WHEN a reminder is added to the call queue, THEN THE System SHALL set status to queued
4. WHEN a call is initiated, THEN THE System SHALL set status to in progress
5. WHEN a call completes successfully, THEN THE System SHALL set status to completed
6. WHEN a call is skipped due to payment, THEN THE System SHALL set status to skipped
7. WHEN all retry attempts are exhausted, THEN THE System SHALL set status to failed
8. THE System SHALL record the reason for skipped reminders

### Requirement 11: Sync Window Cleanup

**User Story:** As a system administrator, I want the system to remove bills that are no longer relevant, so that the database doesn't grow indefinitely.

#### Acceptance Criteria

1. WHEN a bill's due date is beyond the sync window, THEN THE System SHALL remove it from the cache
2. WHEN removing a bill from cache, THEN THE System SHALL delete associated reminders
3. THE System SHALL not remove overdue bills from the cache
4. THE System SHALL not remove paid bills from the cache for historical tracking
5. THE System SHALL perform cleanup during daily sync operations

### Requirement 12: User Settings Persistence

**User Story:** As a user, I want my reminder settings to be saved, so that I don't have to reconfigure them each time.

#### Acceptance Criteria

1. THE System SHALL persist reminder schedule settings per user
2. THE System SHALL persist call timing settings per user
3. THE System SHALL persist timezone settings per user
4. THE System SHALL persist country and holiday settings per user
5. THE System SHALL persist retry settings per user
6. WHEN a user updates settings, THEN THE System SHALL save changes immediately
7. THE System SHALL load user settings when performing sync and reminder operations

### Requirement 13: Multi-User Support

**User Story:** As a system administrator, I want the system to support multiple users, so that each business can have independent reminder configurations.

#### Acceptance Criteria

1. THE System SHALL associate bills with the user who owns them
2. THE System SHALL associate reminders with the user who owns them
3. THE System SHALL isolate bill data between different users
4. THE System SHALL apply user-specific settings when syncing bills
5. THE System SHALL apply user-specific settings when scheduling reminders
6. THE System SHALL support organization-level grouping of users

### Requirement 14: Retry Logic and Failure Handling

**User Story:** As a user, I want the system to retry failed calls, so that temporary issues don't prevent customers from receiving reminders.

#### Acceptance Criteria

1. WHEN a call fails to connect, THEN THE System SHALL increment the attempt count
2. WHEN the attempt count is below the maximum, THEN THE System SHALL schedule a retry
3. THE System SHALL wait the configured delay hours before retrying
4. WHEN the maximum retry attempts are reached, THEN THE System SHALL mark the reminder as failed
5. THE System SHALL not retry calls that were successfully connected
6. THE System SHALL track the timestamp of each attempt

### Requirement 15: Voice Agent Context Preparation

**User Story:** As a voice agent, I want to receive complete and accurate bill information, so that I can have meaningful conversations with customers.

#### Acceptance Criteria

1. THE System SHALL provide the voice agent with customer name
2. THE System SHALL provide the voice agent with bill number
3. THE System SHALL provide the voice agent with original bill amount
4. THE System SHALL provide the voice agent with current amount due
5. THE System SHALL provide the voice agent with due date
6. THE System SHALL provide the voice agent with days until due or days overdue
7. THE System SHALL provide the voice agent with available payment methods
8. THE System SHALL provide the voice agent with company contact information
9. THE System SHALL format all data in a structure suitable for voice agent consumption

### Requirement 16: Scheduler Execution

**User Story:** As a system administrator, I want the system to automatically check for due reminders, so that calls are made at the appropriate times.

#### Acceptance Criteria

1. THE System SHALL run a reminder scheduler at regular intervals
2. THE System SHALL query for reminders where scheduled date is today or earlier
3. THE System SHALL query for reminders with status pending
4. THE System SHALL query for reminders where attempt count is below maximum
5. THE System SHALL check call window eligibility before queueing calls
6. THE System SHALL process reminders in chronological order by scheduled date
7. THE System SHALL run the scheduler at least every 30 minutes

### Requirement 17: API Integration with Zoho Books

**User Story:** As a system administrator, I want the system to integrate with Zoho Books API, so that bill data is synchronized accurately.

#### Acceptance Criteria

1. THE System SHALL authenticate with Zoho Books using OAuth
2. THE System SHALL fetch bills using Zoho Books API
3. THE System SHALL filter bills by status, due date range, and last modified timestamp
4. THE System SHALL handle Zoho API rate limits gracefully
5. THE System SHALL handle Zoho API errors and retry when appropriate
6. THE System SHALL use the organization ID to fetch bills for the correct organization
7. THE System SHALL parse bill data including customer details, amounts, dates, and status

### Requirement 18: API Integration with LiveKit

**User Story:** As a system administrator, I want the system to integrate with LiveKit for voice calls, so that reminders can be delivered via phone.

#### Acceptance Criteria

1. THE System SHALL initiate outbound calls using LiveKit API
2. THE System SHALL provide call context to the LiveKit agent
3. THE System SHALL receive call outcome data from LiveKit
4. THE System SHALL handle LiveKit API errors gracefully
5. THE System SHALL track LiveKit call IDs for reference
6. THE System SHALL configure the voice agent prompt with bill-specific information

### Requirement 19: Dashboard and Reporting

**User Story:** As a user, I want to view reminder activity and outcomes, so that I can monitor the effectiveness of payment reminders.

#### Acceptance Criteria

1. THE System SHALL display a list of upcoming reminders
2. THE System SHALL display a list of completed reminders with outcomes
3. THE System SHALL display reminder success rates
4. THE System SHALL display bills awaiting payment
5. THE System SHALL allow filtering reminders by date range
6. THE System SHALL allow filtering reminders by status
7. THE System SHALL display call outcomes and customer responses

### Requirement 20: Settings UI

**User Story:** As a user, I want an intuitive interface to configure reminder settings, so that I can easily customize the system to my needs.

#### Acceptance Criteria

1. THE System SHALL provide a settings page for reminder configuration
2. THE System SHALL display checkboxes for each standard reminder option
3. THE System SHALL provide input fields for custom reminder days
4. THE System SHALL provide a timezone selector with search functionality
5. THE System SHALL provide time pickers for call start and end times
6. THE System SHALL provide day-of-week selectors for call days
7. THE System SHALL provide a country selector for holiday calendars
8. THE System SHALL provide input fields for retry settings
9. THE System SHALL validate user inputs before saving
10. THE System SHALL display confirmation when settings are saved successfully
