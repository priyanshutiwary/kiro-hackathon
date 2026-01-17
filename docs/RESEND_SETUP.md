# Resend Email Service Setup

This document outlines the environment variables needed for the Resend email service integration.

## Required Environment Variables

Add the following environment variables to your `.env` or `.env.local` file:

```bash
# Resend Email Service Configuration
RESEND_API_KEY=your_resend_api_key_here

# Optional: Custom from email address (defaults to 'InvoCall <noreply@invocall.com>')
RESEND_FROM_EMAIL=InvoCall <noreply@yourdomain.com>

# Optional: Custom app name (defaults to 'InvoCall')
NEXT_PUBLIC_APP_NAME=InvoCall
```

## Getting Your Resend API Key

1. Sign up for a Resend account at [https://resend.com](https://resend.com)
2. Go to your dashboard and navigate to API Keys
3. Create a new API key with the necessary permissions
4. Copy the API key and add it to your environment variables

## Email Templates

The email service includes three built-in templates:

1. **Email Verification** - Sent when users register with email/password
2. **Password Reset** - Sent when users request password reset
3. **Welcome Email** - Sent after successful email verification

All templates are responsive and branded with your app's styling.

## Testing Email Configuration

The email service includes a validation function that checks for required environment variables on startup. If any required variables are missing, the application will log an error and throw an exception.

## Rate Limiting

The email service respects Resend's rate limits and includes built-in error handling for delivery failures.