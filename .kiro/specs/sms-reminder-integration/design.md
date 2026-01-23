# Design Document

## Overview

This feature adds SMS reminder capability using Twilio, providing a cost-effective alternative to voice calls for non-urgent payment reminders. The system supports two modes: Smart Mode (automatic channel selection) and Manual Mode (user-selected channel).

## Architecture

### High-Level Flow

```
Invoice Sync → Reminder Creation → Channel Assignment → Scheduled Execution
                                          ↓
                                    [Smart Mode?]
                                    ↙         ↘
                            [Early: SMS]  [Urgent: Voice]
                                    ↓         ↓
                            Twilio API   LiveKit API
                                    ↓         ↓
                            Status Webhook Updates
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Reminder Settings                         │
│  - smartMode: boolean                                        │
│  - manualChannel: 'sms' | 'voice'                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Reminder Scheduler                          │
│  - Reads settings                                            │
│  - Assigns channel based on mode and urgency                 │
│  - Creates reminder records with channel                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Payment Reminders Table                     │
│  - channel: 'sms' | 'voice'                                 │
│  - externalId: Twilio SID or LiveKit call ID               │
│  - status: pending | in_progress | completed | failed       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────┬──────────────────────────────────────┐
│   SMS Executor       │      Voice Executor                  │
│   (Twilio)           │      (LiveKit)                       │
└──────────────────────┴──────────────────────────────────────┘
```

## Database Schema Changes

### reminder_settings Table

```sql
ALTER TABLE reminder_settings 
ADD COLUMN smartMode boolean NOT NULL DEFAULT true,
ADD COLUMN manualChannel text DEFAULT 'voice';
```

**Fields:**
- `smartMode`: When true, system auto-selects channel. When false, uses manualChannel
- `manualChannel`: User's preferred channel when smartMode is false ('sms' or 'voice')

### payment_reminders Table

```sql
ALTER TABLE payment_reminders 
ADD COLUMN channel text NOT NULL DEFAULT 'voice',
ADD COLUMN externalId text;
```

**Fields:**
- `channel`: Delivery method for this reminder ('sms' or 'voice')
- `externalId`: Twilio message SID (for SMS) or LiveKit call ID (for voice)

**Note:** Reusing existing `status` field for both SMS and voice status tracking.

## Channel Assignment Logic

### Smart Mode (smartMode = true)

```typescript
function assignChannel(reminderType: string): 'sms' | 'voice' {
  const earlyReminderTypes = [
    '30_days_before',
    '15_days_before', 
    '7_days_before',
    '5_days_before'
  ];
  
  const urgentReminderTypes = [
    '3_days_before',
    '1_day_before',
    'due_date',
    '1_day_overdue',
    '3_days_overdue',
    '7_days_overdue'
  ];
  
  if (earlyReminderTypes.includes(reminderType)) {
    return 'sms';
  }
  
  if (urgentReminderTypes.includes(reminderType)) {
    return 'voice';
  }
  
  // Default to voice for safety
  return 'voice';
}
```

### Manual Mode (smartMode = false)

```typescript
function assignChannel(settings: ReminderSettings): 'sms' | 'voice' {
  return settings.manualChannel; // 'sms' or 'voice'
}
```

## SMS Implementation

### Twilio Client

```typescript
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface SMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

class TwilioSMSClient {
  async sendSMS(
    to: string,
    message: string
  ): Promise<SMSResult> {
    // Send SMS via Twilio API
    // Return message SID on success
  }
  
  async getMessageStatus(
    messageSid: string
  ): Promise<'delivered' | 'failed' | 'pending'> {
    // Query Twilio for message status
  }
}
```

### SMS Message Template

```typescript
interface MessageData {
  customerName: string;
  invoiceNumber: string;
  amount: string;
  currencySymbol: string;
  dueDate: string;
  companyName: string;
}

function formatSMSMessage(data: MessageData): string {
  const formattedDate = formatDate(data.dueDate); // "Feb 15"
  const formattedAmount = `${data.currencySymbol}${data.amount}`;
  
  return `Hi ${data.customerName}, reminder: Invoice #${data.invoiceNumber} for ${formattedAmount} is due on ${formattedDate}. - ${data.companyName}`;
}
```

**Example Output:**
```
Hi John Smith, reminder: Invoice #1234 for $500.00 is due on Feb 15. - Acme Corp
```

## Reminder Execution Flow

### SMS Execution

```typescript
async function executeSMSReminder(reminder: PaymentReminder) {
  // 1. Update status to in_progress
  await updateReminderStatus(reminder.id, 'in_progress');
  
  // 2. Get customer and invoice data
  const invoice = await getInvoice(reminder.invoiceId);
  const customer = await getCustomer(invoice.customerId);
  const businessProfile = await getBusinessProfile(reminder.userId);
  
  // 3. Format message
  const message = formatSMSMessage({
    customerName: customer.customerName,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amountDue,
    currencySymbol: getCurrencySymbol(invoice.currencyCode),
    dueDate: invoice.dueDate,
    companyName: businessProfile.companyName
  });
  
  // 4. Send SMS
  const result = await twilioClient.sendSMS(
    customer.primaryPhone,
    message
  );
  
  // 5. Update reminder with result
  if (result.success) {
    await updateReminder(reminder.id, {
      status: 'completed', // Will be updated by webhook if delivery fails
      externalId: result.messageSid,
      lastAttemptAt: new Date(),
      attemptCount: reminder.attemptCount + 1
    });
  } else {
    await updateReminder(reminder.id, {
      status: 'failed',
      skipReason: result.error,
      lastAttemptAt: new Date(),
      attemptCount: reminder.attemptCount + 1
    });
  }
}
```

### Voice Execution (Existing)

```typescript
async function executeVoiceReminder(reminder: PaymentReminder) {
  // Existing LiveKit implementation
  // No changes needed
}
```

### Unified Executor

```typescript
async function executeReminder(reminder: PaymentReminder) {
  if (reminder.channel === 'sms') {
    await executeSMSReminder(reminder);
  } else if (reminder.channel === 'voice') {
    await executeVoiceReminder(reminder);
  } else {
    throw new Error(`Unknown channel: ${reminder.channel}`);
  }
}
```

## Twilio Webhook Handler

### Webhook Endpoint

```
POST /api/webhooks/twilio/status
```

### Request Format (from Twilio)

```json
{
  "MessageSid": "SM1234567890abcdef",
  "MessageStatus": "delivered",
  "To": "+1234567890",
  "From": "+0987654321",
  "ErrorCode": null
}
```

### Handler Logic

```typescript
async function handleTwilioWebhook(request: Request) {
  // 1. Validate Twilio signature
  const isValid = validateTwilioSignature(request);
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // 2. Parse webhook data
  const { MessageSid, MessageStatus } = await request.json();
  
  // 3. Find reminder by externalId
  const reminder = await findReminderByExternalId(MessageSid);
  if (!reminder) {
    return Response.json({ error: 'Reminder not found' }, { status: 404 });
  }
  
  // 4. Update reminder status
  const newStatus = mapTwilioStatus(MessageStatus);
  await updateReminderStatus(reminder.id, newStatus);
  
  return Response.json({ success: true });
}

function mapTwilioStatus(twilioStatus: string): ReminderStatus {
  switch (twilioStatus) {
    case 'delivered':
    case 'sent':
      return 'completed';
    case 'failed':
    case 'undelivered':
      return 'failed';
    default:
      return 'in_progress';
  }
}
```

## Environment Variables

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Webhook Security
TWILIO_WEBHOOK_SECRET=your_webhook_secret_here
```

## API Endpoints

### Update Reminder Settings

```
PUT /api/reminder-settings
```

**Request Body:**
```json
{
  "smartMode": true,
  "manualChannel": "voice"
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "smartMode": true,
    "manualChannel": "voice"
  }
}
```

### Get Reminder Statistics

```
GET /api/reminders/stats
```

**Response:**
```json
{
  "totalReminders": 150,
  "smsCount": 90,
  "voiceCount": 60,
  "completedSMS": 85,
  "completedVoice": 55,
  "failedSMS": 5,
  "failedVoice": 5
}
```

## UI Components

### Settings Page Updates

```typescript
// Reminder Settings Form
<div>
  <label>
    <input 
      type="radio" 
      name="mode" 
      value="smart"
      checked={smartMode}
    />
    Smart Mode (Recommended)
    <p>SMS for early reminders, voice for urgent</p>
  </label>
  
  <label>
    <input 
      type="radio" 
      name="mode" 
      value="manual"
      checked={!smartMode}
    />
    Manual Mode
  </label>
  
  {!smartMode && (
    <select value={manualChannel}>
      <option value="sms">SMS Only</option>
      <option value="voice">Voice Only</option>
    </select>
  )}
</div>
```

### Reminder List Display

```typescript
// Show channel badge for each reminder
<Badge variant={reminder.channel === 'sms' ? 'secondary' : 'default'}>
  {reminder.channel === 'sms' ? '📱 SMS' : '📞 Voice'}
</Badge>
```

## Error Handling

### SMS Sending Failures

1. **Invalid Phone Number**: Mark as failed, don't retry
2. **Twilio API Error**: Mark as failed, schedule retry
3. **Rate Limit**: Wait and retry after delay
4. **Network Error**: Schedule retry with exponential backoff

### Webhook Failures

1. **Invalid Signature**: Return 401, log security event
2. **Reminder Not Found**: Return 404, log warning
3. **Database Error**: Return 500, log error, Twilio will retry

## Testing Strategy

### Unit Tests

1. Channel assignment logic (smart mode)
2. Channel assignment logic (manual mode)
3. SMS message formatting
4. Twilio webhook signature validation
5. Status mapping from Twilio to internal status

### Integration Tests

1. End-to-end SMS sending
2. Webhook status update flow
3. Retry logic for failed SMS
4. Smart mode channel selection
5. Manual mode channel selection

### Manual Testing

1. Send test SMS to real phone number
2. Verify message content and formatting
3. Test webhook delivery status updates
4. Test retry logic with failed messages
5. Verify anti-spam protection (no duplicates)

## Migration Plan

### Phase 1: Database Migration

```sql
-- Add new columns
ALTER TABLE reminder_settings 
ADD COLUMN smartMode boolean NOT NULL DEFAULT true,
ADD COLUMN manualChannel text DEFAULT 'voice';

ALTER TABLE payment_reminders 
ADD COLUMN channel text NOT NULL DEFAULT 'voice',
ADD COLUMN externalId text;

-- Create index for externalId lookups
CREATE INDEX idx_payment_reminders_external_id 
ON payment_reminders(externalId);
```

### Phase 2: Code Deployment

1. Deploy Twilio client implementation
2. Deploy webhook handler
3. Deploy updated reminder executor
4. Deploy UI updates

### Phase 3: Configuration

1. Add Twilio credentials to environment
2. Configure webhook URL in Twilio dashboard
3. Test with small user group
4. Roll out to all users

## Monitoring and Alerts

### Metrics to Track

1. SMS delivery rate (delivered / sent)
2. SMS failure rate
3. Average SMS cost per reminder
4. Voice vs SMS usage ratio
5. Webhook processing time

### Alerts

1. SMS delivery rate drops below 90%
2. Twilio API errors exceed threshold
3. Webhook processing failures
4. Missing Twilio credentials

## Cost Analysis

### Estimated Costs

- **SMS**: $0.0075 per message (US)
- **Voice**: $0.04 - $0.30 per call

### Smart Mode Savings

For 100 reminders per month:
- 60 early reminders (SMS): 60 × $0.0075 = $0.45
- 40 urgent reminders (Voice): 40 × $0.10 = $4.00
- **Total**: $4.45/month

vs. Voice Only:
- 100 voice calls: 100 × $0.10 = $10.00/month

**Savings**: ~55% cost reduction with smart mode

## Security Considerations

1. **Webhook Authentication**: Validate Twilio signature on all webhook requests
2. **Phone Number Validation**: Sanitize and validate phone numbers before sending
3. **Rate Limiting**: Implement rate limits to prevent abuse
4. **PII Protection**: Don't log full phone numbers or message content
5. **Credential Security**: Store Twilio credentials in environment variables, never in code

## Future Enhancements

1. Two-way SMS (customer can reply)
2. Custom SMS templates per business
3. A/B testing for message content
4. SMS scheduling optimization
5. Multi-language support for SMS
6. SMS analytics dashboard
7. Cost tracking and budgeting
8. WhatsApp integration (future phase)

