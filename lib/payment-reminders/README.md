# Payment Reminder System

This directory contains the implementation of the automated payment reminder call system that integrates with Zoho Books.

## Components

### Core Modules

- **sync-engine.ts** - Main synchronization engine that orchestrates invoice syncing
- **settings-manager.ts** - Manages user reminder settings and preferences
- **zoho-books-client.ts** - Client for interacting with Zoho Books API
- **reminder-schedule.ts** - Builds reminder schedules based on user settings
- **invoice-hash.ts** - Handles invoice change detection using hash comparison

### Cron Jobs

#### Daily Invoice Sync

**Endpoint:** `/api/cron/sync-invoices`

**Schedule:** Daily at 2:00 AM UTC (configured in `vercel.json`)

**Purpose:** Synchronizes invoices from Zoho Books for all users with active integrations.

**Configuration:**

1. **Vercel Cron (Recommended for Vercel deployments)**
   - The cron job is automatically configured in `vercel.json`
   - Vercel will call the endpoint daily at the scheduled time
   - Set `CRON_SECRET` environment variable for security

2. **External Cron Service (Alternative)**
   - Use services like cron-job.org, EasyCron, or AWS EventBridge
   - Configure to POST to: `https://your-domain.com/api/cron/sync-invoices`
   - Include `Authorization: Bearer YOUR_CRON_SECRET` header

3. **Manual Testing**
   - Set `ALLOW_MANUAL_CRON_TRIGGER=true` in environment variables
   - Visit: `https://your-domain.com/api/cron/sync-invoices` (GET request)
   - Or use curl: `curl -X POST https://your-domain.com/api/cron/sync-invoices -H "Authorization: Bearer YOUR_CRON_SECRET"`

**Environment Variables:**

```env
# Required for cron job security
CRON_SECRET=your-secret-key-here

# Optional: Allow manual trigger via GET request (for testing)
ALLOW_MANUAL_CRON_TRIGGER=true
```

**Response Format:**

```json
{
  "success": true,
  "message": "Daily invoice sync completed",
  "summary": {
    "totalUsers": 5,
    "successCount": 4,
    "errorCount": 1
  },
  "results": [
    {
      "userId": "user123",
      "success": true,
      "invoicesFetched": 25,
      "invoicesInserted": 3,
      "invoicesUpdated": 22,
      "remindersCreated": 3,
      "errors": []
    }
  ]
}
```

## Usage

### Syncing Invoices for a User

```typescript
import { syncInvoicesForUser } from '@/lib/payment-reminders/sync-engine';

const result = await syncInvoicesForUser(userId, organizationId);

console.log(`Fetched: ${result.invoicesFetched}`);
console.log(`Inserted: ${result.invoicesInserted}`);
console.log(`Updated: ${result.invoicesUpdated}`);
console.log(`Errors: ${result.errors.length}`);
```

### Managing User Settings

```typescript
import { getUserSettings, updateUserSettings } from '@/lib/payment-reminders/settings-manager';

// Get settings
const settings = await getUserSettings(userId);

// Update settings
const result = await updateUserSettings(userId, {
  reminder7DaysBefore: true,
  callTimezone: 'America/New_York',
  callStartTime: '09:00:00',
  callEndTime: '17:00:00',
});

if (!result.success) {
  console.error('Validation errors:', result.errors);
}
```

### Building Reminder Schedules

```typescript
import { buildReminderSchedule } from '@/lib/payment-reminders/reminder-schedule';

const dueDate = new Date('2025-02-15');
const schedule = buildReminderSchedule(dueDate, settings);

schedule.forEach(reminder => {
  console.log(`${reminder.reminderType}: ${reminder.scheduledDate}`);
});
```

## Architecture

### Sync Flow

1. **Get User Settings** - Retrieve reminder configuration for the user
2. **Calculate Sync Window** - Determine date range based on enabled reminders
3. **Fetch Invoices** - Query Zoho Books API with filters (incremental sync)
4. **Process Each Invoice** - Upsert invoice and detect changes
5. **Create Reminders** - Generate reminder schedule for new/updated invoices
6. **Cleanup** - Remove invoices outside sync window
7. **Update Metadata** - Record sync timestamp

### Change Detection

The system uses SHA-256 hashing to detect invoice changes:

- Hash includes: invoice_number, total, balance, due_date, status, customer_phone
- When hash differs, specific changes are identified:
  - Status change → Cancel reminders if paid
  - Due date change → Recreate all reminders
  - Amount change → Update cached amount
  - Phone change → Update cached phone

### Incremental Sync

After the first full sync, subsequent syncs only fetch invoices modified since the last sync:

- Uses Zoho's `last_modified_time` field
- Significantly reduces API calls and processing time
- Ensures data freshness without full re-sync

## Testing

### Unit Tests

Run unit tests for individual components:

```bash
npm test lib/payment-reminders
```

### Integration Tests

Test the complete sync flow:

```bash
npm test -- --testPathPattern=sync-engine.integration
```

### Manual Testing

1. Set up test environment variables
2. Enable manual cron trigger: `ALLOW_MANUAL_CRON_TRIGGER=true`
3. Visit: `http://localhost:3000/api/cron/sync-invoices`
4. Check logs and database for results

## Monitoring

### Logs

The sync engine logs important events:

- `[Cron] Starting daily invoice sync...` - Sync job started
- `[Cron] Found X users with Zoho Books integration` - Users to sync
- `[Cron] Syncing invoices for user X...` - Per-user sync start
- `[Cron] Sync successful for user X` - Per-user sync success
- `[Cron] Daily sync complete` - Overall summary

### Error Handling

Errors are logged and included in the response:

- Individual user sync failures don't stop the entire job
- Errors are collected and returned in the response
- Check `errorCount` in summary for quick health check

### Alerts

Consider setting up alerts for:

- High error count in sync results
- Sync job not running (missed cron execution)
- Repeated failures for specific users
- Zoho API rate limit errors

## Security

### Cron Job Protection

The cron endpoint is protected by:

1. **Authorization Header** - Requires `Bearer ${CRON_SECRET}`
2. **Vercel Cron Secret** - Automatically verified by Vercel
3. **Manual Trigger Control** - Disabled by default in production

### Data Security

- OAuth tokens are encrypted in database
- Sensitive data (phone numbers) should be encrypted at rest
- User data is isolated (row-level security)

## Troubleshooting

### Sync Not Running

1. Check Vercel Cron configuration in dashboard
2. Verify `vercel.json` is deployed
3. Check environment variables are set
4. Review Vercel function logs

### Sync Errors

1. Check user has active Zoho integration
2. Verify OAuth tokens are valid
3. Check Zoho API rate limits
4. Review error messages in sync results

### Missing Invoices

1. Verify sync window calculation
2. Check invoice due dates are within window
3. Ensure invoice status is 'unpaid' or 'partially_paid'
4. Review Zoho API filters

### Duplicate Reminders

1. Check `reminders_created` flag on invoices
2. Verify unique constraint on (user_id, zoho_invoice_id)
3. Review reminder creation logic

## Future Enhancements

- [ ] Add retry logic for failed syncs
- [ ] Implement exponential backoff for API errors
- [ ] Add metrics and monitoring dashboard
- [ ] Support for multiple Zoho organizations per user
- [ ] Batch processing for large invoice volumes
- [ ] Webhook support for real-time updates
