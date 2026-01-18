# Webhook Configuration Guide

## Overview

The payment reminder system uses webhooks to receive real-time call status updates from the Python agent. This ensures accurate tracking of call outcomes and enables proper retry logic.

## Environment Variables

### Backend (Next.js)

Add the following to your `.env` or `.env.local` file:

```bash
WEBHOOK_SECRET=your-secure-random-secret-key-here
```

**Important:** Use a strong, random secret key. You can generate one using:

```bash
openssl rand -hex 32
```

### Python Agent

Add the following to your `agent/.env.local` file:

```bash
WEBHOOK_URL=https://yourdomain.com/api/webhooks/call-status
WEBHOOK_SECRET=your-secure-random-secret-key-here
```

**Important:** The `WEBHOOK_SECRET` must match exactly between the backend and the Python agent.

## How It Works

1. **Call Initiated**: Backend creates a reminder and dispatches a call via LiveKit
2. **Call Answered**: Python agent sends `call_answered` webhook → Backend updates status to `processing`
3. **Call Completed**: Python agent sends `call_completed` webhook with outcome data → Backend updates status to `completed` or `pending` (for retry)
4. **Call Failed**: Python agent sends `call_failed` webhook → Backend updates status to `failed`

## Webhook Events

### call_answered

Sent when the call is successfully connected.

```json
{
  "reminder_id": "uuid",
  "event_type": "call_answered"
}
```

### call_completed

Sent when the call ends with outcome data.

```json
{
  "reminder_id": "uuid",
  "event_type": "call_completed",
  "outcome": {
    "connected": true,
    "duration": 45,
    "customer_response": "will_pay_today",
    "notes": "Customer confirmed payment"
  }
}
```

### call_failed

Sent when the call fails to connect.

```json
{
  "reminder_id": "uuid",
  "event_type": "call_failed",
  "outcome": {
    "connected": false,
    "duration": 0,
    "customer_response": "no_answer",
    "notes": "Timeout waiting for participant to join"
  }
}
```

## Authentication

All webhook requests are authenticated using HMAC-SHA256:

1. The Python agent generates an HMAC signature of the request payload using the `WEBHOOK_SECRET`
2. The signature is sent in the `X-Webhook-Signature` header
3. The backend verifies the signature before processing the request
4. Invalid signatures result in a 401 Unauthorized response

## Retry Logic

The Python agent implements automatic retry with exponential backoff:

- **Attempt 1**: Immediate
- **Attempt 2**: 2 seconds delay
- **Attempt 3**: 4 seconds delay

After 3 failed attempts, the error is logged for manual investigation.

## Timeout Handling

If a reminder stays in `in_progress` status for more than 10 minutes without receiving a webhook, the timeout monitor will:

1. Mark the reminder as `failed`
2. Set `skip_reason` to "Call timeout - no agent response"
3. Log the timeout for monitoring
4. Allow retry scheduling

## Testing

To test the webhook integration:

1. Ensure both backend and agent have matching `WEBHOOK_SECRET` values
2. Start the backend server
3. Start the Python agent
4. Create a test reminder and dispatch a call
5. Monitor logs to verify webhook delivery

## Troubleshooting

### Webhook authentication failures

- Verify `WEBHOOK_SECRET` matches exactly in both backend and agent
- Check that the secret doesn't contain extra whitespace or newlines

### Webhook not being sent

- Verify `WEBHOOK_URL` is set in the agent configuration
- Check agent logs for webhook errors
- Ensure the backend endpoint is accessible from the agent

### Reminders stuck in 'in_progress'

- Check if webhooks are being delivered successfully
- Verify the timeout monitor is running (part of cron job)
- Check backend logs for webhook processing errors
