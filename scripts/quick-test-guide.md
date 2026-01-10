# Quick Testing Guide for Payment Reminders

# Quick Testing Guide for Payment Reminders

## 🚀 Quick Start

### 1. Test Reminder Processing (Simple)
```bash
# Make sure dev server is running
npm run dev

# Test reminder processing
curl -X GET "http://localhost:3000/api/cron/process-reminders" | jq '.'

# Or use the API test script
node scripts/test-db-api.js process
```

### 2. Check Processing Results
```bash
# Simple API test
node scripts/test-db-api.js process

# Full test with before/after comparison
./scripts/test-reminders.sh -v
```

### 3. Interactive Testing
```bash
# Run comprehensive tests
./scripts/test-reminders.sh -v -q
```

## 📋 Essential Commands

### Reminder Processing
```bash
# Process reminders (curl)
curl -X GET "http://localhost:3000/api/cron/process-reminders"

# Process reminders (script)
node scripts/test-db-api.js process

# Process with authentication (if needed)
curl -X POST "http://localhost:3000/api/cron/process-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### API Testing (Working Endpoints)
```bash
# Process reminders
node scripts/test-db-api.js process

# Test server connection
node scripts/test-db-api.js connection

# Run full test suite
node scripts/test-db-api.js test
```

### Manual curl Commands
```bash
# Process reminders
curl -X GET "http://localhost:3000/api/cron/process-reminders" | jq '.'

# With pretty output and timing
curl -X GET "http://localhost:3000/api/cron/process-reminders" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"
```

## 🔧 Setup Test Data

### Create Test Reminder
```bash
# First, get your user ID and invoice ID from database
node scripts/test-db-queries.js --query=reminder-summary

# Then create test reminder
node scripts/test-db-queries.js --query=create-test-reminder --user=YOUR_USER_ID --invoice=YOUR_INVOICE_ID
```

### Manual Database Setup
```sql
-- Create a test reminder due now
INSERT INTO payment_reminders (
  id, user_id, invoice_id, scheduled_date, status, 
  reminder_type, attempt_count, created_at, updated_at
) VALUES (
  'test_reminder_' || extract(epoch from now()),
  'YOUR_USER_ID',
  'YOUR_INVOICE_ID', 
  now(),
  'pending',
  'payment_due',
  0,
  now(),
  now()
);
```

## 🐛 Troubleshooting

### No Due Reminders Found
```bash
# Check if any reminders exist
node scripts/test-db-queries.js --query=reminder-summary

# Check specific reminder status
node scripts/test-db-queries.js --query=reminder --id=YOUR_REMINDER_ID
```

### Call Processing Fails
```bash
# Check invoice has phone number
node scripts/test-db-queries.js --query=invoice --id=YOUR_INVOICE_ID

# Check user settings
node scripts/test-db-queries.js --query=settings --user=YOUR_USER_ID

# Test verification
node scripts/test-db-queries.js --query=verify-invoice --invoice=INV_ID --user=USER_ID
```

### Authentication Issues
```bash
# Add to .env file
echo "ALLOW_MANUAL_CRON_TRIGGER=true" >> .env

# Or use cron secret
curl -X POST "http://localhost:3000/api/cron/process-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 Monitoring Flow

### Before Processing
```bash
node scripts/test-db-queries.js --query=reminder-summary
```

### Trigger Processing
```bash
curl -X GET "http://localhost:3000/api/cron/process-reminders" | jq '.'
```

### After Processing
```bash
node scripts/test-db-queries.js --query=reminder-summary
```

### Check Specific Results
```bash
# Check if reminder status changed
node scripts/test-db-queries.js --query=reminder --id=YOUR_REMINDER_ID
```

## 🎯 Testing Scenarios

### 1. Normal Flow Test
```bash
# 1. Create test reminder due now
node scripts/test-db-queries.js --query=create-test-reminder --user=USER_ID --invoice=INV_ID

# 2. Process reminders
curl -X GET "http://localhost:3000/api/cron/process-reminders"

# 3. Check results
node scripts/test-db-queries.js --query=reminder-summary
```

### 2. Pre-call Verification Test
```bash
# Test with paid invoice (should skip)
node scripts/test-db-queries.js --query=verify-invoice --invoice=PAID_INV_ID --user=USER_ID

# Test with unpaid invoice (should proceed)
node scripts/test-db-queries.js --query=verify-invoice --invoice=UNPAID_INV_ID --user=USER_ID
```

### 3. Call Window Test
```bash
# Check current settings
node scripts/test-db-queries.js --query=settings --user=USER_ID

# Process during/outside call window
curl -X GET "http://localhost:3000/api/cron/process-reminders"
```

## 📝 Expected Outputs

### Successful Processing
```json
{
  "success": true,
  "message": "Reminder processing completed",
  "duration": 1234,
  "timestamp": "2024-01-10T10:30:00.000Z",
  "errors": 0
}
```

### Due Reminders Found
```
=== DUE REMINDERS ===
Found 2 due reminders

1. Reminder ID: rem_123
   User ID: user_456
   Invoice ID: inv_789
   Scheduled: 2024-01-10T09:00:00.000Z
   Status: pending
   Attempts: 0
   Type: payment_due
```

### No Due Reminders
```
[WARN] No due reminders found
```

This guide covers the essential testing commands you need to verify reminder fetching and pre-call verification functionality!