# Reminder Settings API

This API manages user reminder settings including channel selection (SMS/Voice) and scheduling preferences.

## Endpoints

### GET /api/reminder-settings

Fetches the current user's reminder settings.

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "userId": "user-123",
  "organizationId": "org-456",
  "smartMode": true,
  "manualChannel": "voice",
  "reminder7DaysBefore": true,
  "reminder3DaysBefore": true,
  "reminder1DayBefore": true,
  "reminderOnDueDate": true,
  "reminder1DayOverdue": true,
  "reminder3DaysOverdue": true,
  "callTimezone": "UTC",
  "callStartTime": "09:00:00",
  "callEndTime": "18:00:00",
  "callDaysOfWeek": [1, 2, 3, 4, 5],
  "language": "en",
  "voiceGender": "female",
  "maxRetryAttempts": 3,
  "retryDelayHours": 2
}
```

### PUT /api/reminder-settings

Updates the user's reminder settings.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "smartMode": false,
  "manualChannel": "sms",
  "reminder7DaysBefore": true,
  "callTimezone": "America/New_York"
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    // ... updated settings object
  }
}
```

**Error Response (400 - Validation Error):**
```json
{
  "error": "Invalid settings",
  "details": [
    "Invalid manual channel. Must be either sms or voice."
  ]
}
```

## Channel Selection

### Smart Mode (Recommended)

When `smartMode` is `true`, the system automatically selects the best channel based on urgency:

- **SMS**: Early reminders (30, 15, 7, 5 days before due date)
- **Voice**: Urgent reminders (3, 1 day before, due date, overdue)

This optimizes costs while maintaining effectiveness for critical reminders.

### Manual Mode

When `smartMode` is `false`, all reminders use the channel specified in `manualChannel`:

- `"sms"`: All reminders sent via SMS
- `"voice"`: All reminders sent via voice call

## Field Validation

### smartMode
- Type: `boolean`
- Default: `true`
- Description: Enable automatic channel selection based on urgency

### manualChannel
- Type: `string`
- Valid values: `"sms"` | `"voice"`
- Default: `"voice"`
- Description: Channel to use when smartMode is disabled
- Validation: Must be either "sms" or "voice" (case-sensitive)

### Other Fields

See the main settings-manager documentation for validation rules on other fields like:
- `callTimezone`: Must be valid IANA timezone
- `callStartTime`/`callEndTime`: Must be in HH:MM:SS format
- `callDaysOfWeek`: Array of integers 0-6 (Sunday-Saturday)
- `maxRetryAttempts`: Integer 0-10
- `retryDelayHours`: Integer 1-48
- `language`: "en" | "hi" | "hinglish"
- `voiceGender`: "male" | "female"

## Examples

### Enable Smart Mode
```bash
curl -X PUT https://api.example.com/api/reminder-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smartMode": true
  }'
```

### Use SMS for All Reminders
```bash
curl -X PUT https://api.example.com/api/reminder-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smartMode": false,
    "manualChannel": "sms"
  }'
```

### Use Voice for All Reminders
```bash
curl -X PUT https://api.example.com/api/reminder-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smartMode": false,
    "manualChannel": "voice"
  }'
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **1.1**: Smart mode toggle provided
- **1.2**: Smart mode automatically selects SMS for early reminders and voice for urgent reminders
- **1.3**: Manual mode allows user to select either SMS or voice for all reminders
- **1.4**: Configuration is validated (manualChannel must be 'sms' or 'voice')
- **1.5**: Default values set (smartMode: true, manualChannel: 'voice') for new users

## Notes

- Settings changes only affect future reminders, not existing scheduled reminders
- The `organizationId` is automatically populated from Zoho Books integration if available
- All settings are user-specific and stored in the `reminder_settings` table
