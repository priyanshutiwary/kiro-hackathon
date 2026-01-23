# Requirements Document

## Introduction

This feature adds SMS reminder capability alongside existing voice call reminders. Business owners can choose between SMS-only, voice-only, or smart mode (SMS for early reminders, voice for urgent ones). This provides a cost-effective alternative for non-urgent reminders while maintaining voice calls for critical situations.

## Glossary

- **SMS**: Text message sent via Twilio
- **Smart Mode**: Automatic channel selection based on reminder urgency
- **Manual Mode**: User-selected single channel for all reminders
- **Channel**: Delivery method for reminder (sms or voice)
- **Early Reminder**: Reminders 7+ days before due date
- **Urgent Reminder**: Reminders 3 days before, due date, or overdue
- **Twilio**: SMS service provider for sending text messages

## Requirements

### Requirement 1: Channel Selection Settings

**User Story:** As a business owner, I want to choose how reminders are sent, so that I can balance cost and effectiveness.

#### Acceptance Criteria

1. WHEN configuring reminder settings, THE System SHALL provide a smart mode toggle
2. WHEN smart mode is enabled, THE System SHALL automatically select SMS for early reminders and voice for urgent reminders
3. WHEN smart mode is disabled, THE System SHALL allow user to select either SMS or voice for all reminders
4. WHEN saving channel settings, THE System SHALL validate the configuration
5. THE System SHALL default to smart mode enabled for new users

### Requirement 2: Smart Mode Channel Assignment

**User Story:** As a system, I want to automatically assign the right channel based on urgency, so that costs are optimized while maintaining effectiveness.

#### Acceptance Criteria

1. WHEN creating reminders in smart mode, THE System SHALL assign SMS channel to 7-day, 15-day, 30-day, and 5-day reminders
2. WHEN creating reminders in smart mode, THE System SHALL assign voice channel to 3-day, 1-day, due date, and overdue reminders
3. WHEN a reminder is created, THE System SHALL store the assigned channel in the database
4. WHEN displaying reminders, THE System SHALL show the assigned channel
5. THE System SHALL not change channel assignment after reminder creation

### Requirement 3: Manual Mode Channel Assignment

**User Story:** As a business owner, I want to use only SMS or only voice, so that I have full control over communication method.

#### Acceptance Criteria

1. WHEN manual mode is enabled with SMS selected, THE System SHALL assign SMS channel to all reminders
2. WHEN manual mode is enabled with voice selected, THE System SHALL assign voice channel to all reminders
3. WHEN switching from smart to manual mode, THE System SHALL apply the new setting to future reminders only
4. WHEN switching from manual to smart mode, THE System SHALL apply the new setting to future reminders only
5. THE System SHALL not modify existing reminder channels when settings change

### Requirement 4: SMS Message Sending

**User Story:** As a system, I want to send SMS reminders via Twilio, so that customers receive text notifications.

#### Acceptance Criteria

1. WHEN a reminder with SMS channel is due, THE System SHALL send an SMS via Twilio API
2. WHEN sending SMS, THE System SHALL include customer name, invoice number, amount, and due date
3. WHEN sending SMS, THE System SHALL use the business profile company name as sender
4. WHEN SMS is sent successfully, THE System SHALL store the Twilio message SID in externalId field
5. WHEN SMS sending fails, THE System SHALL mark the reminder as failed with error details

### Requirement 5: SMS Message Templates

**User Story:** As a business owner, I want professional SMS messages, so that customers receive clear payment reminders.

#### Acceptance Criteria

1. THE System SHALL use a standard template: "Hi {name}, reminder: Invoice #{number} for {amount} is due on {date}. - {company}"
2. WHEN the message exceeds 160 characters, THE System SHALL truncate gracefully
3. WHEN formatting amounts, THE System SHALL include currency symbol
4. WHEN formatting dates, THE System SHALL use readable format (e.g., "Feb 15")
5. THE System SHALL support multi-language templates (English, Hindi, Hinglish) based on user settings

### Requirement 6: SMS Status Tracking

**User Story:** As a system, I want to track SMS delivery status, so that I know if messages were received.

#### Acceptance Criteria

1. WHEN SMS is sent, THE System SHALL update reminder status to 'in_progress'
2. WHEN Twilio confirms delivery, THE System SHALL update reminder status to 'completed'
3. WHEN Twilio reports delivery failure, THE System SHALL update reminder status to 'failed'
4. WHEN SMS status is updated, THE System SHALL record the timestamp in lastAttemptAt
5. THE System SHALL handle Twilio webhook callbacks for status updates

### Requirement 7: Retry Logic for SMS

**User Story:** As a system, I want to retry failed SMS reminders, so that temporary failures don't prevent customer notification.

#### Acceptance Criteria

1. WHEN an SMS reminder fails, THE System SHALL schedule a retry after the configured delay (default 2 hours)
2. WHEN retrying, THE System SHALL increment the attemptCount
3. WHEN attemptCount reaches maxRetryAttempts, THE System SHALL mark the reminder as permanently failed
4. WHEN retrying SMS, THE System SHALL use the same channel (not switch to voice)
5. THE System SHALL respect the retry delay and max attempts from reminder settings

### Requirement 8: Database Schema Updates

**User Story:** As a developer, I want minimal database changes, so that the implementation is clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL add smartMode boolean field to reminder_settings table (default: true)
2. THE System SHALL add manualChannel text field to reminder_settings table (default: 'voice')
3. THE System SHALL add channel text field to payment_reminders table (default: 'voice')
4. THE System SHALL add externalId text field to payment_reminders table for storing Twilio message SID or LiveKit call ID
5. THE System SHALL reuse existing status field for tracking SMS delivery status

### Requirement 9: Twilio Configuration

**User Story:** As a system administrator, I want to configure Twilio credentials, so that SMS sending works correctly.

#### Acceptance Criteria

1. THE System SHALL read Twilio Account SID from environment variables
2. THE System SHALL read Twilio Auth Token from environment variables
3. THE System SHALL read Twilio phone number from environment variables
4. WHEN Twilio credentials are missing, THE System SHALL log an error and skip SMS reminders
5. WHEN Twilio credentials are invalid, THE System SHALL mark SMS reminders as failed

### Requirement 10: Anti-Spam Protection

**User Story:** As a business owner, I want to avoid spamming customers, so that I maintain good relationships.

#### Acceptance Criteria

1. THE System SHALL send only one reminder per scheduled date (never SMS and voice on same day)
2. THE System SHALL respect the minimum retry delay of 2 hours between attempts
3. THE System SHALL respect the maximum retry attempts limit (default: 3)
4. WHEN an invoice is paid, THE System SHALL cancel all pending reminders for that invoice
5. THE System SHALL not send reminders outside configured business hours

### Requirement 11: UI Updates for Channel Display

**User Story:** As a business owner, I want to see which channel each reminder uses, so that I understand my communication plan.

#### Acceptance Criteria

1. WHEN viewing scheduled reminders, THE System SHALL display the channel (SMS or Voice) for each reminder
2. WHEN viewing reminder history, THE System SHALL show which channel was used
3. WHEN viewing reminder settings, THE System SHALL clearly show current mode (Smart or Manual)
4. WHEN in manual mode, THE System SHALL show the selected channel
5. THE System SHALL use clear icons or badges to distinguish SMS from voice reminders

### Requirement 12: Cost Tracking

**User Story:** As a business owner, I want to understand communication costs, so that I can budget effectively.

#### Acceptance Criteria

1. WHEN viewing reminder statistics, THE System SHALL show count of SMS reminders sent
2. WHEN viewing reminder statistics, THE System SHALL show count of voice reminders sent
3. THE System SHALL display SMS and voice counts separately in the dashboard
4. WHEN viewing individual reminders, THE System SHALL indicate the channel used
5. THE System SHALL provide monthly summary of SMS vs voice usage

