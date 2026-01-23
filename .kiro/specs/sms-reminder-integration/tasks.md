# Implementation Tasks

## Overview

This plan implements SMS reminder capability using Twilio, providing a cost-effective alternative to voice calls for non-urgent payment reminders. The system supports Smart Mode (automatic channel selection) and Manual Mode (user-selected channel).

## Tasks

- [x] 1. Database schema updates
  - Create migration for reminder_settings table (add smartMode, manualChannel)
  - Create migration for payment_reminders table (add channel, externalId)
  - Create index on payment_reminders.externalId for webhook lookups
  - Run migrations and verify schema changes
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2. Twilio SMS client implementation
  - Create TwilioSMSClient class in `lib/payment-reminders/twilio-client.ts`
  - Implement sendSMS method with Twilio API integration
  - Implement getMessageStatus method for status queries
  - Add environment variable configuration (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
  - Handle Twilio API errors and rate limiting
  - _Requirements: 4.1, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. SMS message formatting
  - Create formatSMSMessage function in `lib/payment-reminders/sms-formatter.ts`
  - Implement message template with customer name, invoice number, amount, due date, company name
  - Handle currency symbol formatting using existing currency utils
  - Handle date formatting (readable format like "Feb 15")
  - Implement message truncation for 160 character limit
  - Add support for multi-language templates (English, Hindi, Hinglish)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Channel assignment logic
  - Create assignChannel function in `lib/payment-reminders/channel-assignment.ts`
  - Implement smart mode: map early reminders (30, 15, 7, 5 days) to SMS
  - Implement smart mode: map urgent reminders (3, 1 day, due, overdue) to voice
  - Implement manual mode: use manualChannel from settings
  - Add default fallback to voice for unknown types
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Update reminder scheduler with channel assignment
  - Modify `reminder-scheduler.ts` to call assignChannel during reminder creation
  - Store assigned channel in payment_reminders table
  - Ensure channel is set before reminder is saved
  - Apply settings changes to future reminders only (don't modify existing)
  - _Requirements: 2.3, 2.4, 2.5, 3.3, 3.4, 3.5_

- [x] 6. SMS reminder executor
  - Create executeSMSReminder function in `lib/payment-reminders/sms-executor.ts`
  - Fetch invoice, customer, and business profile data
  - Format SMS message using sms-formatter
  - Send SMS via Twilio client
  - Update reminder status to 'in_progress' before sending
  - Store Twilio message SID in externalId field on success
  - Mark as 'failed' with error details on failure
  - Update lastAttemptAt and attemptCount
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Update unified reminder executor
  - Modify `call-executor.ts` to route based on channel field
  - Add SMS channel routing to executeSMSReminder
  - Keep existing voice channel routing to executeVoiceReminder
  - Handle unknown channel types with error
  - _Requirements: 4.1_

- [x] 8. SMS retry logic
  - Update retry scheduling in reminder processor to handle SMS failures
  - Schedule retry after configured delay (default 2 hours)
  - Increment attemptCount on each retry
  - Mark as permanently failed after maxRetryAttempts
  - Ensure retry uses same channel (don't switch SMS to voice)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Twilio webhook endpoint
  - Create `/api/webhooks/twilio/status/route.ts` endpoint
  - Implement Twilio signature validation using TWILIO_WEBHOOK_SECRET
  - Parse webhook payload (MessageSid, MessageStatus, ErrorCode)
  - Find reminder by externalId (Twilio message SID)
  - Map Twilio status to internal status (delivered→completed, failed→failed)
  - Update reminder status and lastAttemptAt timestamp
  - Return appropriate error codes (401, 404, 500)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Update reminder settings API
  - Add smartMode field to PUT /api/reminder-settings endpoint
  - Add manualChannel field to PUT /api/reminder-settings endpoint
  - Validate manualChannel values ('sms' or 'voice')
  - Include smartMode and manualChannel in GET response
  - Set default values (smartMode: true, manualChannel: 'voice') for new users
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 11. Reminder statistics API
  - Update GET /api/reminders/stats to count reminders by channel
  - Add smsCount and voiceCount to response
  - Add completedSMS and completedVoice counts
  - Add failedSMS and failedVoice counts
  - Update reminder list endpoints to include channel information
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 12. UI - Settings page updates
  - Add channel mode selection (Smart Mode vs Manual Mode radio buttons)
  - Add description for each mode
  - Show manual channel selector (SMS/Voice dropdown) when manual mode selected
  - Implement form logic to handle mode toggle and channel selection
  - Submit updated settings to API
  - Show success/error messages
  - Highlight Smart Mode as recommended with cost savings info
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 13. UI - Reminder list display
  - Add channel badges to reminder list (📱 SMS / 📞 Voice icons)
  - Use distinct colors for SMS vs voice badges
  - Update reminder details view to show channel and externalId
  - Add channel filter (All / SMS Only / Voice Only)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 14. UI - Dashboard statistics
  - Add SMS vs voice statistics to dashboard
  - Display count of SMS reminders sent
  - Display count of voice reminders sent
  - Show success rates for each channel
  - Create cost tracking visualization showing estimated costs
  - Display monthly usage summary
  - Highlight cost savings with smart mode
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 15. Anti-spam protection
  - Implement duplicate prevention (only one reminder per scheduled date)
  - Prevent SMS and voice on same day for same invoice
  - Implement business hours enforcement from reminder settings
  - Cancel all pending reminders when invoice is paid
  - Respect minimum retry delay (2 hours) and max attempts (3)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 16. Error handling and logging
  - Handle invalid phone numbers (mark as failed, don't retry)
  - Handle Twilio API errors (mark as failed, schedule retry)
  - Handle rate limiting (wait and retry after delay)
  - Handle network errors (schedule retry with exponential backoff)
  - Log SMS sending attempts, delivery status updates, webhook processing
  - Log errors with context (no PII - don't log full phone numbers)
  - _Requirements: 4.5, 9.4, 9.5_

- [x] 17. Environment variables and configuration
  - Add TWILIO_ACCOUNT_SID to environment variables
  - Add TWILIO_AUTH_TOKEN to environment variables
  - Add TWILIO_PHONE_NUMBER to environment variables
  - Add TWILIO_WEBHOOK_SECRET to environment variables
  - Update .env.example with Twilio configuration
  - Document webhook configuration in README
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 18. Unit tests
  - Test channel assignment logic (smart mode for all reminder types)
  - Test channel assignment logic (manual mode SMS and voice)
  - Test SMS message formatting with various inputs
  - Test message truncation for 160 character limit
  - Test Twilio client sendSMS method
  - Test webhook signature validation
  - Test Twilio status mapping to internal status
  - _Requirements: All_

- [ ] 19. Integration tests
  - Test end-to-end SMS sending flow
  - Test webhook status update flow
  - Test retry logic for failed SMS
  - Test smart mode channel selection during reminder creation
  - Test manual mode channel selection during reminder creation
  - Test anti-spam protection (no duplicates)
  - _Requirements: All_

- [ ] 20. Manual testing and deployment
  - Send test SMS to real phone numbers
  - Verify message content and formatting
  - Test webhook delivery status updates
  - Test retry logic with failed messages
  - Configure Twilio webhook URL in Twilio dashboard
  - Deploy to staging and test end-to-end
  - Deploy to production with monitoring
  - _Requirements: All_

## Notes

- Each task references specific requirements for traceability
- Tasks should be executed in order as they have dependencies
- Database migrations (Task 1) must be completed before other tasks
- Twilio client (Task 2) and message formatting (Task 3) are prerequisites for SMS execution
- UI tasks (12-14) can be done in parallel with backend tasks once APIs are ready
- Testing tasks (18-19) should be done incrementally alongside implementation
