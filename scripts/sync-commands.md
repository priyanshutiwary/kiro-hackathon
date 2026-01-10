# Invoice Sync Test Commands

This file contains curl commands to test the invoice sync cron job.

## Prerequisites

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```

2. For manual testing, add this to your `.env` file:
   ```bash
   ALLOW_MANUAL_CRON_TRIGGER=true
   ```

## Test Commands

### 1. Manual Trigger (GET) - No Authentication Required

```bash
curl -X GET "http://localhost:3000/api/cron/sync-invoices" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"
```

### 2. Production-like (POST) - No Authentication

```bash
curl -X POST "http://localhost:3000/api/cron/sync-invoices" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"
```

### 3. With Cron Secret Authentication (POST)

If you have `CRON_SECRET` set in your `.env` file:

```bash
curl -X POST "http://localhost:3000/api/cron/sync-invoices" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"
```

### 4. Pretty JSON Output

For formatted JSON response:

```bash
curl -X GET "http://localhost:3000/api/cron/sync-invoices" \
  -H "Content-Type: application/json" \
  -s | jq '.'
```

## Expected Response

A successful sync should return something like:

```json
{
  "success": true,
  "message": "Daily invoice sync completed",
  "summary": {
    "totalUsers": 1,
    "successCount": 1,
    "errorCount": 0
  },
  "results": [
    {
      "userId": "6woGXZRV8Ec1K7QOXJrCY6pI7E6YJAvw",
      "success": true,
      "invoicesFetched": 1,
      "invoicesInserted": 1,
      "invoicesUpdated": 0
    }
  ]
}
```

## Troubleshooting

### Error: Manual trigger not allowed
- Add `ALLOW_MANUAL_CRON_TRIGGER=true` to your `.env` file

### Error: Unauthorized
- Check if `CRON_SECRET` is set and you're using the correct value
- Try the GET method without authentication first

### Error: Zoho API errors
- Check your Zoho Books integration is properly configured
- Verify your access tokens are valid
- Check the terminal logs for detailed error messages

## Quick Test Script

You can also use the interactive script:

```bash
chmod +x scripts/test-sync.sh
./scripts/test-sync.sh
```

Or with options:

```bash
./scripts/test-sync.sh -s your_cron_secret
./scripts/test-sync.sh -u https://your-production-url.com -s secret
```