# Zoho Books Integration

Location: `lib/zoho-*.ts`, `app/api/zoho/**`, `app/dashboard/bills/**`, `app/dashboard/invoices/**`

This integration enables users to connect their Zoho Books account and view their business bills and invoices within the application.

## Features

- **OAuth 2.0 Authentication**: Secure connection to Zoho Books accounts
- **Multi-DC Support**: Automatic detection and handling of Zoho's regional data centers (US, EU, IN, AU, JP, CA)
- **Token Management**: Encrypted storage with automatic refresh
- **Bills Fetching**: Retrieve and display business bills with pagination
- **Invoices Fetching**: Retrieve and display customer invoices
- **Integration Status**: Real-time connection status tracking
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Architecture

### Components

1. **OAuth Service** (`lib/zoho-oauth.ts`)
   - Handles OAuth 2.0 flow
   - Token exchange and refresh
   - Token revocation

2. **Token Manager** (`lib/zoho-token-manager.ts`)
   - Secure token storage with AES-256-GCM encryption
   - Token retrieval and updates
   - Integration status management

3. **API Client** (`lib/zoho-api-client.ts`)
   - Makes authenticated requests to Zoho Books API
   - Automatic token refresh on expiry
   - Retry logic with exponential backoff

4. **API Routes** (`app/api/zoho/**`)
   - `/api/zoho/auth/connect` - Initiates OAuth flow
   - `/api/zoho/auth/callback` - Handles OAuth callback
   - `/api/zoho/auth/disconnect` - Disconnects integration
   - `/api/zoho/bills` - Fetches bills
   - `/api/zoho/invoices` - Fetches invoices
   - `/api/zoho/status` - Checks integration status

5. **UI Components**
   - `app/dashboard/integrations/page.tsx` - Integration management
   - `app/dashboard/bills/page.tsx` - Bills list view
   - `app/dashboard/invoices/page.tsx` - Invoices list view

## Setup

### 1. Create Zoho API Credentials

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Create a new "Server-based Application"
3. Set the redirect URI to: `https://yourdomain.com/api/zoho/auth/callback`
4. Note your Client ID and Client Secret

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Zoho Books Integration
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REDIRECT_URI=http://localhost:3000/api/zoho/auth/callback
ZOHO_SCOPE=ZohoBooks.bills.READ,ZohoBooks.invoices.READ,ZohoBooks.settings.READ

# Encryption (required for token storage)
ENCRYPTION_KEY=your_encryption_key_here
```

**Important**: The `ZohoBooks.settings.READ` scope is required to fetch the organization ID.

### 3. Database Schema

The integration uses the existing `agentIntegrations` table in the database. No additional migrations are needed.

## Usage

### User Flow

1. **Connect Account**
   - User navigates to `/dashboard/integrations`
   - Clicks "Connect" on Zoho Books card
   - Redirected to Zoho authorization page
   - Grants permissions
   - Redirected back to app with tokens stored

2. **View Bills**
   - User navigates to `/dashboard/bills`
   - Bills are automatically fetched from Zoho Books
   - Displayed in a table with vendor, amount, date, status

3. **View Invoices**
   - User navigates to `/dashboard/invoices`
   - Invoices are automatically fetched from Zoho Books
   - Displayed in a table with customer, amount, date, status

4. **Disconnect**
   - User clicks "Disconnect" on integrations page
   - Tokens are revoked and deleted from database

## API Reference

### OAuth Service

```typescript
import { ZohoOAuthService } from '@/lib/zoho-oauth';

const oauthService = new ZohoOAuthService();

// Get authorization URL
const authUrl = oauthService.getAuthorizationUrl(state);

// Exchange code for tokens
const tokens = await oauthService.exchangeCodeForTokens(code, location, accountsServer);

// Refresh access token
const newTokens = await oauthService.refreshAccessToken(refreshToken, accountsServer);

// Revoke tokens
await oauthService.revokeTokens(refreshToken, accountsServer);
```

### Token Manager

```typescript
import { ZohoTokenManager } from '@/lib/zoho-token-manager';

const tokenManager = new ZohoTokenManager();

// Store tokens
await tokenManager.storeTokens(userId, tokens, organizationId, accountsServer);

// Get integration
const integration = await tokenManager.getIntegration(userId);

// Update tokens
await tokenManager.updateTokens(userId, newTokens);

// Delete integration
await tokenManager.deleteIntegration(userId);

// Check if valid
const isValid = await tokenManager.hasValidIntegration(userId);
```

### API Client

```typescript
import { ZohoAPIClient } from '@/lib/zoho-api-client';

const apiClient = new ZohoAPIClient();

// Fetch bills
const billsResponse = await apiClient.getBills(userId, page);

// Fetch invoices
const invoicesResponse = await apiClient.getInvoices(userId, page);

// Get single bill
const bill = await apiClient.getBill(userId, billId);
```

## Data Models

### Bill

```typescript
interface ZohoBill {
  billId: string;
  vendorId: string;
  vendorName: string;
  billNumber: string;
  referenceNumber: string;
  date: string;
  dueDate: string;
  status: 'open' | 'paid' | 'void' | 'overdue';
  total: number;
  balance: number;
  currencyCode: string;
  currencySymbol: string;
}
```

### Invoice

```typescript
interface ZohoInvoice {
  invoiceId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  referenceNumber: string;
  date: string;
  dueDate: string;
  status: 'sent' | 'draft' | 'overdue' | 'paid' | 'void' | 'unpaid' | 'partially_paid';
  total: number;
  balance: number;
  currencyCode: string;
  currencySymbol: string;
}
```

### Integration

```typescript
interface StoredIntegration {
  id: string;
  userId: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  accessTokenExpiresAt: Date;
  config: {
    organizationId: string;
    accountsServer: string;
  };
  status: string;
  enabled: boolean;
  lastSyncAt: Date | null;
  errorMessage: string | null;
}
```

## Multi-DC Support

Zoho Books operates in multiple data centers worldwide. The integration automatically detects and uses the correct data center based on the OAuth callback parameters.

**Supported Data Centers:**
- US: `https://accounts.zoho.com`
- EU: `https://accounts.zoho.eu`
- India: `https://accounts.zoho.in`
- Australia: `https://accounts.zoho.com.au`
- Japan: `https://accounts.zoho.jp`
- Canada: `https://accounts.zoho.com.cn`

The `accountsServer` and `location` parameters from the OAuth callback are stored and used for all subsequent API requests.

## Security

### Token Encryption

All OAuth tokens are encrypted using AES-256-GCM before storage:

```typescript
// Tokens are encrypted before storage
const encryptedAccessToken = encrypt(tokens.accessToken);
const encryptedRefreshToken = encrypt(tokens.refreshToken);

// And decrypted when retrieved
const accessToken = decrypt(integration.accessToken);
const refreshToken = decrypt(integration.refreshToken);
```

### HTTPS Only

All API communications with Zoho Books use HTTPS. The OAuth flow enforces secure connections.

### Scope Minimization

The integration only requests the minimum required scopes:
- `ZohoBooks.bills.READ` - Read bills
- `ZohoBooks.invoices.READ` - Read invoices
- `ZohoBooks.settings.READ` - Read organization settings (required for org ID)

## Error Handling

### Common Errors

1. **401 Unauthorized**
   - Cause: Invalid or expired access token
   - Action: Automatic token refresh and retry

2. **403 Forbidden**
   - Cause: Insufficient permissions
   - Action: Display error, prompt user to reconnect with proper scopes

3. **429 Rate Limited**
   - Cause: Too many requests
   - Action: Exponential backoff, retry after delay

4. **503 Service Unavailable**
   - Cause: Zoho API temporarily down
   - Action: Display error, suggest retry later

### Error Messages

User-friendly error messages are displayed for all error scenarios:

```typescript
const errorMessages = {
  'invalid_token': 'Your Zoho connection has expired. Please reconnect.',
  'insufficient_scope': 'Additional permissions are required. Please reconnect.',
  'rate_limited': 'Too many requests. Please try again in a few minutes.',
  'service_unavailable': 'Zoho Books is temporarily unavailable. Please try again later.',
};
```

## Testing

### Manual Testing

1. **OAuth Flow**
   - Click "Connect" on integrations page
   - Verify redirect to Zoho
   - Grant permissions
   - Verify redirect back with success message
   - Check database for encrypted tokens

2. **Bills Fetching**
   - Navigate to `/dashboard/bills`
   - Verify bills are displayed
   - Check pagination if >200 bills
   - Verify currency formatting

3. **Token Refresh**
   - Wait for token to expire (or manually expire in DB)
   - Make API request
   - Verify automatic refresh and retry

4. **Disconnect**
   - Click "Disconnect"
   - Verify tokens removed from database
   - Verify integration status shows "Available"

### Automated Testing

Property-based tests are defined in the design document but not yet implemented. See `.kiro/specs/zoho-bills-integration/design.md` for test specifications.

## Troubleshooting

### "Organization ID not found" Error

**Cause**: Missing `ZohoBooks.settings.READ` scope

**Solution**: Add the scope to `ZOHO_SCOPE` in `.env` and reconnect

### "Invalid redirect URI" Error

**Cause**: Mismatch between configured redirect URI and actual callback URL

**Solution**: Ensure `ZOHO_REDIRECT_URI` matches the URI configured in Zoho API Console

### Tokens Not Refreshing

**Cause**: Invalid refresh token or encryption key changed

**Solution**: Disconnect and reconnect the integration

### Bills Not Displaying

**Cause**: No bills in Zoho Books account or API error

**Solution**: Check browser console for errors, verify integration status

## Future Enhancements

- Property-based testing implementation
- Bill payment tracking
- Invoice creation and editing
- Expense tracking
- Multi-currency support improvements
- Webhook support for real-time updates
- Bulk operations (export, archive)
- Advanced filtering and search

## Related Documentation

- [Encryption Utility](./encryption-utility.md)
- [Zoho Books API Documentation](https://www.zoho.com/books/api/v3/)
- [OAuth 2.0 Specification](https://oauth.net/2/)

## Spec Documents

Complete requirements, design, and implementation tasks are available in:
- `.kiro/specs/zoho-bills-integration/requirements.md`
- `.kiro/specs/zoho-bills-integration/design.md`
- `.kiro/specs/zoho-bills-integration/tasks.md`
