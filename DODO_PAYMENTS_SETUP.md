# Dodo Payments Integration Guide

This project has been migrated from Polar.sh to Dodo Payments using the official [Better Auth Dodo Payments plugin](https://www.better-auth.com/docs/plugins/dodopayments). This guide will help you complete the setup.

## Required Environment Variables

Add the following environment variables to your `.env` or `.env.local` file:

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_dodo_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=your_dodo_webhook_secret_here

# Product Configuration
NEXT_PUBLIC_STARTER_TIER=pdt_gok24Vsklq5ghJL9Z96Ve  # Replace with your Dodo product ID

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Or your production URL

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-change-in-production

# Database Configuration (Neon Postgres)
DATABASE_URL=your_postgres_connection_string

# Auth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# R2 Storage (for profile images)
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_public_url
```

## Getting Your Dodo Payments Credentials

### 1. API Key

1. Go to [Dodo Payments Dashboard](https://app.dodopayments.com)
2. Navigate to **Settings > API**
3. Generate a new API key
4. Copy and paste it into `DODO_PAYMENTS_API_KEY`

### 2. Webhook Secret

1. In the Dodo Payments Dashboard, go to **Settings > Webhooks**
2. Create a new webhook endpoint with the URL: `https://yourdomain.com/api/auth/dodopayments/webhooks`
   - Note: The Better Auth plugin uses this default endpoint
3. Copy the webhook secret key
4. Paste it into `DODO_WEBHOOK_SECRET`

### 3. Product ID

From your terminal output, you already have the migrated product ID:
- **Product ID**: `pdt_gok24Vsklq5ghJL9Z96Ve`
- **Product Name**: basic
- **Price**: $10.00 USD (monthly)

Set this in your environment variables:
```bash
NEXT_PUBLIC_STARTER_TIER=pdt_gok24Vsklq5ghJL9Z96Ve
```

## Webhook Events

The integration listens for the following Dodo Payments webhook events:

- `subscription.created` - When a new subscription is created
- `subscription.updated` - When subscription details change
- `subscription.activated` - When a subscription becomes active
- `subscription.canceled` - When a subscription is canceled
- `subscription.expired` - When a subscription expires
- `payment.succeeded` - When a payment succeeds

These are handled in `/app/api/webhooks/dodo/route.ts`

## File Changes Summary

### Dependencies:
- **Added**: `@dodopayments/better-auth`, `dodopayments`, `standardwebhooks`
- **Removed**: `@polar-sh/better-auth`, `@polar-sh/sdk`

### Files Modified:
1. **`/lib/auth.ts`** - Replaced Polar plugin with official Dodo Payments plugin
2. **`/lib/auth-client.ts`** - Added Dodo Payments client plugin
3. **`/app/pricing/_component/pricing-table.tsx`** - Updated to use Better Auth checkout flow
4. **`/app/dashboard/settings/page.tsx`** - Updated to use Dodo customer portal

### Optional Files Created:
- **`/lib/dodo-payments.ts`** - Helper functions (optional, Better Auth handles most of this)
- **`/app/api/webhooks/dodo/route.ts`** - Custom webhook handler (optional, Better Auth has built-in webhook handling)

## How the Payment Flow Works

### 1. Customer Clicks "Get Started"
- Better Auth plugin creates a checkout session using `authClient.dodopayments.checkout({ slug: "starter" })`
- User is redirected to Dodo's secure checkout page
- Customer information is automatically passed from Better Auth session

### 2. Customer Completes Payment
- Customer enters payment details on Dodo's secure checkout page
- After successful payment, they're redirected to your success URL (`/success`)
- Dodo automatically creates a customer account if it doesn't exist

### 3. Webhook Processing
- Dodo Payments sends webhook events to `/api/auth/dodopayments/webhooks`
- Better Auth plugin automatically verifies the signature using `DODO_WEBHOOK_SECRET`
- Webhook events are processed by the `onPayload` handler in `auth.ts`
- You can extend webhook handling to update your database

### 4. Subscription Management
- Users can access the customer portal via `authClient.dodopayments.customer.portal()`
- This opens Dodo's self-service portal for managing subscriptions
- Users can view invoices, update payment methods, and cancel subscriptions
- Current subscription details can be fetched via `authClient.dodopayments.customer.subscriptions.list()`

## Testing

### Test Card Numbers
Use these test card numbers in Dodo Payments sandbox:
- **Success**: `4242 4242 4242 4242`
- Use any future expiration date
- Use any 3-digit CVV

### Testing Webhooks Locally
1. Use a tool like [ngrok](https://ngrok.com/) to expose your local server
2. Set up the webhook URL in Dodo Dashboard: `https://your-ngrok-url.ngrok.io/api/auth/dodopayments/webhooks`
3. Make a test payment and check your console logs for webhook events

## Database Schema

The `subscription` table stores the following fields:
- `id` - Subscription ID from Dodo
- `userId` - Link to the user table
- `productId` - The Dodo product ID
- `status` - active, canceled, expired, etc.
- `amount` - Subscription amount in cents
- `currency` - Currency code (USD, EUR, etc.)
- `recurringInterval` - month or year
- `currentPeriodStart` / `currentPeriodEnd` - Billing period dates
- `cancelAtPeriodEnd` - Boolean flag
- And more...

## Deployment Checklist

- [ ] Set all environment variables in your production environment
- [ ] Update `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Set up webhook endpoint in Dodo Dashboard pointing to `https://yourdomain.com/api/auth/dodopayments/webhooks`
- [ ] Set `NODE_ENV=production` to switch Dodo Payments from test_mode to live_mode
- [ ] Test a real subscription purchase
- [ ] Verify webhook events are being received and processed

## Support

- **Dodo Payments Documentation**: [https://docs.dodopayments.com](https://docs.dodopayments.com)
- **Dodo Payments API Reference**: [https://docs.dodopayments.com/api-reference](https://docs.dodopayments.com/api-reference)
- **Dodo Payments Dashboard**: [https://app.dodopayments.com](https://app.dodopayments.com)

## Migration Notes

Your product "basic" has been successfully migrated from Polar to Dodo Payments:
- **Polar Product ID**: `655cae95-9cb7-43c7-9fb3-d21d2d1e17ea`
- **Dodo Product ID**: `pdt_gok24Vsklq5ghJL9Z96Ve`
- **Price**: $10.00 USD/month

No customers or discounts were migrated as there were none in your Polar account.

