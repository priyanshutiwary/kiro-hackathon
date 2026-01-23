# Twilio SMS Webhook Configuration

## Overview

This webhook endpoint receives status updates from Twilio for SMS messages sent through the payment reminder system. It validates incoming requests using Twilio's signature verification and updates reminder statuses in the database.

## Endpoint

```
POST /api/webhooks/twilio/status
```

## Configuration

### Environment Variables

The webhook requires the following environment variable:

```bash
# Twilio Auth Token (used for webhook signature validation)
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
```

**Note**: The `TWILIO_AUTH_TOKEN` is used for both:
1. Authenticating API requests to Twilio
2. Validating webhook signatures from Twilio

### Twilio Dashboard Configuration

1. Log in to your [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Select your SMS-enabled phone number
4. Scroll to **Messaging Configuration**
5. Set the **Status Callback URL** to:
   ```
   https://yourdomain.com/api/webhooks/twilio/status
   ```
6. Set **HTTP Method** to `POST`
7. Save your changes

## Webhook Payload

Twilio sends the following parameters as `application/x-www-form-urlencoded`:

```
MessageSid: SM1234567890abcdef
MessageStatus: delivered | failed | sent | queued | undelivered
To: +1234567890
From: +0987654321
ErrorCode: 30003 (optional, only on failures)
ErrorMessage: Unreachable destination handset (optional, only on failures)
```

## Status Mapping

The webhook maps Twilio statuses to internal reminder statuses:

| Twilio Status | Internal Status | Description |
|--------------|----------------|-------------|
| `delivered` | `completed` | Message successfully delivered |
| `sent` | `completed` | Message sent (delivery pending) |
| `failed` | `failed` | Message delivery failed |
| `undelivered` | `failed` | Message could not be delivered |
| `queued` | `in_progress` | Message queued for sending |
| `sending` | `in_progress` | Message currently being sent |

## Security

### Signature Validation

All webhook requests are validated using Twilio's signature verification:

1. Twilio signs each request using HMAC-SHA1 with your Auth Token
2. The signature is sent in the `X-Twilio-Signature` header
3. The webhook validates the signature before processing the request
4. Invalid signatures return `401 Unauthorized`

### Signature Algorithm

```
1. Take the full webhook URL (including protocol)
2. Sort POST parameters alphabetically
3. Append each parameter key and value to the URL
4. Sign the resulting string with HMAC-SHA1 using Auth Token
5. Base64 encode the signature
```

## Response Codes

| Status Code | Description |
|------------|-------------|
| `200` | Success - status update processed |
| `400` | Bad Request - missing required fields |
| `401` | Unauthorized - invalid signature |
| `404` | Not Found - reminder not found |
| `500` | Internal Server Error - processing error |

## Error Handling

### Invalid Signature
```json
{
  "success": false,
  "message": "Invalid signature"
}
```

### Missing Fields
```json
{
  "success": false,
  "message": "Missing required fields: MessageSid and MessageStatus"
}
```

### Reminder Not Found
```json
{
  "success": false,
  "message": "Reminder not found"
}
```

## Testing

### Manual Testing

You can test the webhook using curl (requires valid signature):

```bash
# Note: Generating a valid signature manually is complex
# It's recommended to use Twilio's test tools or send a real SMS

curl -X POST https://yourdomain.com/api/webhooks/twilio/status \
  -H "X-Twilio-Signature: <valid_signature>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM1234567890abcdef" \
  -d "MessageStatus=delivered" \
  -d "To=+1234567890" \
  -d "From=+0987654321"
```

### Using Twilio Test Credentials

Twilio provides test credentials that can be used for development:

```bash
# Test Account SID
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Test Auth Token
TWILIO_AUTH_TOKEN=your_test_auth_token_here
```

## Monitoring

### Logs

The webhook logs the following events:

- Signature validation failures
- Missing or invalid fields
- Reminder not found errors
- Status updates (with before/after status)
- Database errors

### Example Log Output

```
[Twilio Webhook] Received status update for SM1234567890abcdef: delivered
[Twilio Webhook] Updating reminder reminder_123 status: in_progress → completed
[Twilio Webhook] Successfully updated reminder reminder_123
```

## Troubleshooting

### Webhook Not Receiving Updates

1. **Check Twilio Configuration**
   - Verify the Status Callback URL is set correctly
   - Ensure the URL is publicly accessible
   - Check that HTTP method is set to POST

2. **Check Environment Variables**
   - Verify `TWILIO_AUTH_TOKEN` is set
   - Ensure the token matches your Twilio account

3. **Check Logs**
   - Look for signature validation errors
   - Check for "Reminder not found" errors
   - Verify the webhook is being called

### Signature Validation Failures

1. **Verify Auth Token**
   - Ensure `TWILIO_AUTH_TOKEN` matches your Twilio account
   - Check for extra whitespace or newlines

2. **Check URL Configuration**
   - The webhook URL in Twilio must match exactly (including protocol)
   - HTTPS is recommended for production

3. **Proxy/Load Balancer Issues**
   - If behind a proxy, ensure the original URL is preserved
   - Check that the `X-Twilio-Signature` header is forwarded

### Reminder Not Found Errors

This usually means:
- The SMS was sent outside the reminder system
- The `externalId` field wasn't set when sending the SMS
- The reminder was deleted before the webhook was received

## Related Documentation

- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [Twilio SMS Status Callbacks](https://www.twilio.com/docs/sms/api/message-resource#message-status-values)
- [SMS Reminder Integration Spec](../../../.kiro/specs/sms-reminder-integration/)
