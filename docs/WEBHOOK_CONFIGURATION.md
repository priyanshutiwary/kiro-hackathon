# Webhook Configuration Guide

## Overview

The payment reminder system uses webhooks to receive real-time status updates from both the Python voice agent and Twilio SMS service. This ensures accurate tracking of reminder outcomes and enables proper retry logic.

## Environment Variables

### Backend (Next.js)

Add the following to your `.env` or `.env.local` file:

```bash
# Voice call webhook authentication
WEBHOOK_SECRET=your-secure-random-secret-key-here

# Twilio SMS webhook authentication
TWILIO_WEBHOOK_SECRET=your-twilio-webhook-secret-here
```

**Important:** Use strong, random secret keys. You can generate them using:

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

### Twilio Configuration

Configure your Twilio phone number to send status callbacks:

1. Log in to [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers → Manage → Active Numbers**
3. Select your SMS-enabled phone number
4. Under **Messaging Configuration**, find **"A MESSAGE STATUS CHANGES"**
5. Set webhook URL: `https://yourdomain.com/api/webhooks/twilio/status`
6. Set HTTP Method: **POST**
7. Save configuration

## How It Works

### Voice Call Flow

1. **Call Initiated**: Backend creates a reminder and dispatches a call via LiveKit
2. **Call Answered**: Python agent sends `call_answered` webhook → Backend updates status to `processing`
3. **Call Completed**: Python agent sends `call_completed` webhook with outcome data → Backend updates status to `completed` or `pending` (for retry)
4. **Call Failed**: Python agent sends `call_failed` webhook → Backend updates status to `failed`

### SMS Flow

1. **SMS Initiated**: Backend creates a reminder and sends SMS via Twilio
2. **SMS Sent**: Twilio accepts message → Backend stores message SID in `externalId`
3. **SMS Delivered**: Twilio sends `delivered` webhook → Backend updates status to `completed`
4. **SMS Failed**: Twilio sends `failed` or `undelivered` webhook → Backend updates status to `failed`

## Webhook Events

### Voice Call Events

#### call_answered

Sent when the call is successfully connected.

```json
{
  "reminder_id": "uuid",
  "event_type": "call_answered"
}
```

#### call_completed

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

#### call_failed

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

### Twilio SMS Events

Twilio sends status updates as form-encoded POST requests with the following parameters:

#### delivered

SMS successfully delivered to recipient.

```
MessageSid=SM1234567890abcdef
MessageStatus=delivered
To=+1234567890
From=+0987654321
```

#### failed

SMS delivery failed (invalid number, carrier issues).

```
MessageSid=SM1234567890abcdef
MessageStatus=failed
ErrorCode=30003
To=+1234567890
From=+0987654321
```

#### undelivered

SMS could not be delivered after being sent.

```
MessageSid=SM1234567890abcdef
MessageStatus=undelivered
ErrorCode=30005
To=+1234567890
From=+0987654321
```

#### sent

SMS accepted by Twilio (in transit).

```
MessageSid=SM1234567890abcdef
MessageStatus=sent
To=+1234567890
From=+0987654321
```

## Authentication

### Voice Call Webhooks

All webhook requests from the Python agent are authenticated using HMAC-SHA256:

1. The Python agent generates an HMAC signature of the request payload using the `WEBHOOK_SECRET`
2. The signature is sent in the `X-Webhook-Signature` header
3. The backend verifies the signature before processing the request
4. Invalid signatures result in a 401 Unauthorized response

### Twilio SMS Webhooks

Twilio webhooks are authenticated using Twilio's signature validation:

1. Twilio generates an HMAC-SHA1 signature using your `TWILIO_WEBHOOK_SECRET`
2. The signature is sent in the `X-Twilio-Signature` header
3. The backend verifies the signature using Twilio's validation library
4. Invalid signatures result in a 401 Unauthorized response

**Note:** The `TWILIO_WEBHOOK_SECRET` is your Twilio Auth Token, not a custom secret.

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

### Voice Call Webhooks

To test the voice call webhook integration:

1. Ensure both backend and agent have matching `WEBHOOK_SECRET` values
2. Start the backend server
3. Start the Python agent
4. Create a test reminder and dispatch a call
5. Monitor logs to verify webhook delivery

### Twilio SMS Webhooks

To test the Twilio SMS webhook integration:

1. Configure Twilio webhook URL in Twilio Console
2. Send a test SMS using the Twilio API or dashboard
3. Monitor backend logs for webhook delivery
4. Verify reminder status updates correctly

You can also test manually using curl:

```bash
# Test Twilio webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/twilio/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: <valid-signature>" \
  -d "MessageSid=SM1234567890abcdef" \
  -d "MessageStatus=delivered" \
  -d "To=+1234567890" \
  -d "From=+0987654321"
```

## Troubleshooting

### Voice Call Webhooks

#### Webhook authentication failures

- Verify `WEBHOOK_SECRET` matches exactly in both backend and agent
- Check that the secret doesn't contain extra whitespace or newlines

#### Webhook not being sent

- Verify `WEBHOOK_URL` is set in the agent configuration
- Check agent logs for webhook errors
- Ensure the backend endpoint is accessible from the agent

#### Reminders stuck in 'in_progress'

- Check if webhooks are being delivered successfully
- Verify the timeout monitor is running (part of cron job)
- Check backend logs for webhook processing errors

### Twilio SMS Webhooks

#### Webhook authentication failures

- Verify `TWILIO_WEBHOOK_SECRET` is set to your Twilio Auth Token
- Check that the webhook URL is correctly configured in Twilio Console
- Ensure the signature validation is working correctly

#### SMS status not updating

- Verify webhook URL is accessible from Twilio's servers (must be public HTTPS)
- Check Twilio Console → Monitor → Logs → Errors for webhook delivery failures
- Ensure the `externalId` field contains the correct Twilio MessageSid
- Check backend logs for webhook processing errors

#### Invalid MessageSid errors

- Verify the reminder's `externalId` matches the Twilio MessageSid
- Check that the SMS was sent successfully before expecting status updates
- Ensure the database query is finding the correct reminder by `externalId`
