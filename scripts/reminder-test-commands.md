# Payment Reminder Test Commands

This file contains curl commands to test the payment reminder processing cron job and pre-call verification.

## Prerequisites

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```

2. For manual testing, add this to your `.env` file:
   ```bash
   ALLOW_MANUAL_CRON_TRIGGER=true
   ```

3. Ensure you have test data in the database:
   - At least one user with reminder settings
   - Some invoices in the cache
   - Some payment reminders with `status = 'pending'` and `scheduled_date <= today`

## Test Commands

### 1. Test Reminder Processing (Manual Trigger - GET)

```bash
curl -X GET "http://localhost:3000/api/cron/process-reminders" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"
```

### 2. Test Reminder Processing (Production-like - POST)

```bash
curl -X POST "http://localhost:3000/api/cron/process-reminders" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"
```

### 3. With Cron Secret Authentication

If you have `CRON_SECRET` set in your `.env` file:

```bash
curl -X POST "http://localhost:3000/api/cron/process-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"
```

### 4. Pretty JSON Output

For formatted JSON response:

```bash
curl -X GET "http://localhost:3000/api/cron/process-reminders" \
  -H "Content-Type: application/json" \
  -s | jq '.'
```

### 5. Test Reminder API Endpoints

#### Get All Reminders
```bash
curl -X GET "http://localhost:3000/api/reminders" \
  -H "Content-Type: application/json" \
  -s | jq '.'
```

#### Get Reminder Stats
```bash
curl -X GET "http://localhost:3000/api/reminders/stats" \
  -H "Content-Type: application/json" \
  -s | jq '.'
```

#### Get Reminder Settings
```bash
curl -X GET "http://localhost:3000/api/reminder-settings" \
  -H "Content-Type: application/json" \
  -s | jq '.'
```

## Expected Responses

### Successful Reminder Processing
```json
{
  "success": true,
  "message": "Reminder processing completed",
  "duration": 1234,
  "timestamp": "2024-01-10T10:30:00.000Z",
  "errors": 0
}
```

### Reminder Processing with Errors
```json
{
  "success": false,
  "message": "Reminder processing completed with errors",
  "duration": 2345,
  "timestamp": "2024-01-10T10:30:00.000Z",
  "errors": 2
}
```

### Reminder Stats Response
```json
{
  "totalReminders": 15,
  "pendingReminders": 3,
  "completedReminders": 8,
  "failedReminders": 2,
  "skippedReminders": 2,
  "overdueInvoices": 5,
  "totalAmountDue": 12500.00
}
```

## Database Query Commands

### Check Due Reminders
```bash
node scripts/test-db-queries.js --query="due-reminders"
```

### Check Reminder by ID
```bash
node scripts/test-db-queries.js --query="reminder" --id="reminder_id_here"
```

### Check Invoice Status
```bash
node scripts/test-db-queries.js --query="invoice" --id="invoice_id_here"
```

### Check User Settings
```bash
node scripts/test-db-queries.js --query="settings" --user="user_id_here"
```

### Create Test Reminder
```bash
node scripts/test-db-queries.js --query="create-test-reminder" --user="user_id_here" --invoice="invoice_id_here"
```

## Pre-Call Verification Testing

### Test Verification Function
```bash
node scripts/test-db-queries.js --query="verify-invoice" --invoice="invoice_id_here" --user="user_id_here"
```

### Test Call Context Preparation
```bash
node scripts/test-db-queries.js --query="call-context" --invoice="invoice_id_here" --user="user_id_here"
```

## Troubleshooting

### Error: Manual trigger not allowed
- Add `ALLOW_MANUAL_CRON_TRIGGER=true` to your `.env` file

### Error: No due reminders found
- Check if you have reminders with `status = 'pending'` and `scheduled_date <= today`
- Use the database query commands to inspect your data

### Error: Call window not available
- Check your reminder settings for call window configuration
- Ensure current time is within the allowed call window

### Error: Invoice verification failed
- Check your Zoho Books integration
- Verify access tokens are valid
- Check if the invoice exists in Zoho Books

### Error: Phone number missing
- Ensure invoices have valid customer phone numbers
- Check the `customer_phone` field in `invoices_cache` table

## Quick Test Scripts

### Interactive Reminder Test
```bash
chmod +x scripts/test-reminders.sh
./scripts/test-reminders.sh
```

### With options
```bash
./scripts/test-reminders.sh -s your_cron_secret
./scripts/test-reminders.sh -u https://your-production-url.com -s secret
```

### Database Query Test
```bash
chmod +x scripts/test-db-queries.js
node scripts/test-db-queries.js --help
```

## Sample Test Data Setup

To create test data for reminder processing:

```bash
# Create a test reminder due today
node scripts/test-db-queries.js --query="setup-test-data"
```

This will create:
- A test invoice in the cache
- A payment reminder due today
- Proper reminder settings for the user

## Monitoring Commands

### Watch Reminder Processing Logs
```bash
# In one terminal, start the dev server with verbose logging
DEBUG=reminder* npm run dev

# In another terminal, trigger reminder processing
curl -X GET "http://localhost:3000/api/cron/process-reminders"
```

### Check Database State Before/After
```bash
# Before processing
node scripts/test-db-queries.js --query="reminder-summary"

# Trigger processing
curl -X GET "http://localhost:3000/api/cron/process-reminders"

# After processing
node scripts/test-db-queries.js --query="reminder-summary"
```