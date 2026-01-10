# Reminder Scheduler

## Overview

The Reminder Scheduler is responsible for automatically processing due payment reminders and initiating calls at the appropriate times. It runs as a cron job every 30 minutes to check for reminders that need to be processed.

## Requirements

This module implements the following requirements:
- **15.1**: Run reminder scheduler at regular intervals
- **15.2**: Query for reminders where scheduled date is today or earlier
- **15.3**: Query for reminders with status pending
- **15.4**: Query for reminders where attempt count is below maximum
- **15.5**: Check call window eligibility before queueing calls
- **15.6**: Process reminders in chronological order by scheduled date
- **15.7**: Run the scheduler at least every 30 minutes

## Architecture

### Components

1. **processReminders()**: Main function that queries and processes due reminders
2. **queueCall()**: Queues individual reminders for call execution
3. **Cron Job**: API endpoint that triggers reminder processing every 30 minutes

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Cron Scheduler (Every 30 min)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    processReminders()                       │
│  1. Query due reminders (scheduled_date <= today)           │
│  2. Filter by status = 'pending'                            │
│  3. Order by scheduled_date (chronological)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  For each       │
                    │  reminder       │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Check Eligibility                              │
│  1. Get user settings                                       │
│  2. Check attempt_count < max_retry_attempts                │
│  3. Check call window (time & day)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              Not Eligible         Eligible
                    │                   │
                    │                   ▼
                    │         ┌─────────────────┐
                    │         │  queueCall()    │
                    │         └─────────────────┘
                    │                   │
                    │                   ▼
                    │         ┌─────────────────────────────┐
                    │         │  1. Update status: queued   │
                    │         │  2. Update status: in_progress│
                    │         │  3. initiateCall()          │
                    │         │  4. handleCallOutcome()     │
                    │         │  5. scheduleRetry() if needed│
                    │         └─────────────────────────────┘
                    │                   │
                    └───────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Next reminder  │
                    └─────────────────┘
```

## Functions

### processReminders()

Main function that processes all due reminders.

**Logic**:
1. Gets current date (today)
2. Queries database for reminders where:
   - `scheduled_date <= today`
   - `status = 'pending'`
3. Orders results by `scheduled_date` (chronological)
4. For each reminder:
   - Gets user settings
   - Checks if `attempt_count < max_retry_attempts`
   - Checks call window eligibility
   - If eligible, queues the call

**Error Handling**:
- Continues processing other reminders if one fails
- Logs errors for debugging

### queueCall(reminderId)

Queues a single reminder for call execution.

**Logic**:
1. Updates reminder status to `'queued'`
2. Updates reminder status to `'in_progress'`
3. Calls `initiateCall()` from Call Executor
4. Calls `handleCallOutcome()` to process result
5. If call failed to connect, calls `scheduleRetry()`

**Error Handling**:
- On error, updates reminder status to `'failed'`
- Records error message in `skip_reason`
- Throws error for logging

## Cron Job Configuration

### Endpoint

`POST /api/cron/process-reminders`

### Schedule

Runs every 30 minutes: `*/30 * * * *`

### Security

The endpoint is protected by:
- Cron secret verification (via `Authorization` header)
- Environment variable: `CRON_SECRET`

### Manual Testing

For testing purposes, a GET endpoint is available:
- `GET /api/cron/process-reminders`
- Only enabled when `ALLOW_MANUAL_CRON_TRIGGER=true`

## Call Window Checking

The scheduler uses the `canMakeCallNow()` function from the Call Window module to check:

1. **Time Window**: Current time must be between `call_start_time` and `call_end_time`
2. **Day of Week**: Current day must be in `call_days_of_week` array
3. **Timezone**: All checks are done in the user's configured timezone

If a reminder is not eligible:
- It remains in `'pending'` status
- Will be checked again in the next scheduler run
- Logs the reason and next available time

## Retry Logic

The scheduler respects the retry configuration:

- **Max Retry Attempts**: From user settings (`max_retry_attempts`)
- **Retry Delay**: From user settings (`retry_delay_hours`)

If a call fails:
1. `handleCallOutcome()` updates the reminder
2. `scheduleRetry()` is called
3. Reminder's `scheduled_date` is updated to `now + retry_delay_hours`
4. Reminder status is set back to `'pending'`
5. Will be picked up in a future scheduler run

If max attempts reached:
- Reminder status is set to `'failed'`
- No further processing

## Status Transitions

Valid status transitions for reminders:

```
pending → queued → in_progress → completed
                                → failed
                                → skipped

pending → skipped (if invoice is paid during pre-call verification)
```

## Integration with Other Modules

### Call Executor
- `initiateCall()`: Initiates the actual call
- `handleCallOutcome()`: Processes call results
- `scheduleRetry()`: Schedules retry attempts

### Call Window
- `canMakeCallNow()`: Checks if call can be made now

### Settings Manager
- `getUserSettings()`: Gets user's reminder settings

## Logging

The scheduler logs:
- Start and completion of processing
- Number of due reminders found
- Each reminder being queued
- Reasons for skipping reminders
- Errors during processing

## Performance Considerations

1. **Batch Processing**: Processes all due reminders in a single run
2. **Chronological Order**: Ensures oldest reminders are processed first
3. **Error Isolation**: One failed reminder doesn't stop others
4. **Database Indexes**: Uses indexes on `(scheduled_date, status)` for efficient queries

## Testing

### Manual Testing

1. Set `ALLOW_MANUAL_CRON_TRIGGER=true` in environment
2. Call `GET /api/cron/process-reminders`
3. Check logs for processing details

### Integration Testing

Test scenarios:
1. Reminder within call window → Should be queued
2. Reminder outside call window → Should be skipped
3. Reminder at max retry attempts → Should be skipped
4. Multiple reminders → Should process in chronological order

## Deployment

### Vercel Cron

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-reminders",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### Environment Variables

Required:
- `CRON_SECRET`: Secret for authenticating cron requests

Optional:
- `ALLOW_MANUAL_CRON_TRIGGER`: Enable manual testing (default: false)

## Monitoring

Monitor the following:
- Cron job execution logs
- Number of reminders processed per run
- Call success/failure rates
- Reminders stuck in `'pending'` status
- Reminders reaching max retry attempts

## Future Enhancements

Potential improvements:
1. Parallel call processing (with rate limiting)
2. Priority queue for urgent reminders
3. Adaptive retry delays based on failure reasons
4. Dashboard for monitoring scheduler health
5. Alerts for scheduler failures
