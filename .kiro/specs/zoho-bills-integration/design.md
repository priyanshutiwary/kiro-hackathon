# Design Document: Zoho Bills Integration

## Overview

This design outlines the implementation of Zoho Books API integration to fetch and display user business bills within the application. The solution follows a standard OAuth 2.0 authentication flow, securely manages tokens, and provides a user-friendly interface for viewing bill data.

The integration consists of three main components:
1. OAuth authentication flow for connecting Zoho Books accounts
2. Backend API services for token management and bill retrieval
3. Frontend UI for displaying bills and managing integration status

## Architecture

### High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │◄───────►│  Next.js App │◄───────►│ Zoho Books  │
│   (Client)  │         │   (Server)   │         │     API     │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │   Database   │
                        │  (Postgres)  │
                        └──────────────┘
```

### Component Interaction Flow

1. User initiates OAuth flow from integrations page
2. Server redirects to Zoho authorization page
3. Zoho redirects back with authorization code
4. Server exchanges code for tokens and stores them encrypted
5. User navigates to bills page
6. Server fetches bills using stored access token
7. Frontend displays bills in structured format

## Components and Interfaces

### 1. OAuth Service (`lib/zoho-oauth.ts`)

Handles OAuth 2.0 authentication flow with Zoho Books.

```typescript
interface ZohoOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  accountsUrl: string; // Multi-DC support
}

interface ZohoTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
}

class ZohoOAuthService {
  // Generate authorization URL for OAuth flow
  getAuthorizationUrl(state: string): string;
  
  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<ZohoTokens>;
  
  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<ZohoTokens>;
  
  // Revoke tokens (disconnect integration)
  async revokeTokens(refreshToken: string): Promise<void>;
}
```

### 2. Token Manager (`lib/zoho-token-manager.ts`)

Manages secure storage and retrieval of OAuth tokens.

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

class ZohoTokenManager {
  // Store tokens securely using agentIntegrations table
  async storeTokens(userId: string, tokens: ZohoTokens, orgId: string, accountsServer: string): Promise<void>;
  
  // Retrieve integration and decrypt tokens
  async getIntegration(userId: string): Promise<StoredIntegration | null>;
  
  // Update tokens (after refresh)
  async updateTokens(userId: string, tokens: ZohoTokens): Promise<void>;
  
  // Delete integration (disconnect)
  async deleteIntegration(userId: string): Promise<void>;
  
  // Check if integration exists and is valid
  async hasValidIntegration(userId: string): Promise<boolean>;
  
  // Update integration status
  async updateStatus(userId: string, status: string, errorMessage?: string): Promise<void>;
}
```

### 3. Zoho API Client (`lib/zoho-api-client.ts`)

Handles API requests to Zoho Books with automatic token refresh.

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

interface BillsResponse {
  bills: ZohoBill[];
  pageContext: {
    page: number;
    perPage: number;
    hasMorePage: boolean;
  };
}

class ZohoAPIClient {
  constructor(private tokenManager: ZohoTokenManager);
  
  // Fetch bills with automatic token refresh
  async getBills(userId: string, page: number = 1): Promise<BillsResponse>;
  
  // Get single bill details
  async getBill(userId: string, billId: string): Promise<ZohoBill>;
  
  // Internal method to handle API requests with retry logic
  private async makeRequest<T>(
    userId: string,
    endpoint: string,
    options?: RequestInit
  ): Promise<T>;
}
```

### 4. API Routes

#### `/api/zoho/auth/callback` (GET)
Handles OAuth callback from Zoho.

```typescript
// Query params: code, state, location, accounts-server
// Returns: Redirect to integrations page with success/error message
```

#### `/api/zoho/auth/connect` (GET)
Initiates OAuth flow.

```typescript
// Returns: Redirect to Zoho authorization page
```

#### `/api/zoho/auth/disconnect` (POST)
Disconnects Zoho integration.

```typescript
// Body: { userId: string }
// Returns: { success: boolean }
```

#### `/api/zoho/bills` (GET)
Fetches bills for authenticated user.

```typescript
// Query params: page (optional)
// Returns: BillsResponse
```

#### `/api/zoho/status` (GET)
Checks integration status.

```typescript
// Returns: { connected: boolean, organizationId?: string }
```

### 5. Database Schema

Use the existing `agentIntegrations` table with the following configuration for Zoho:

```typescript
// No new table needed - use existing agentIntegrations table
// Example Zoho integration record:
{
  id: "generated_id",
  userId: "user_id",
  integrationType: "oauth",
  provider: "zoho_books",
  accessToken: "encrypted_access_token",
  refreshToken: "encrypted_refresh_token",
  accessTokenExpiresAt: timestamp,
  scope: "ZohoBooks.bills.READ",
  config: JSON.stringify({
    organizationId: "org_id",
    accountsServer: "https://accounts.zoho.com", // For Multi-DC support
  }),
  status: "active",
  enabled: true,
  lastSyncAt: timestamp,
  errorMessage: null,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

The `config` field will store Zoho-specific data as JSON:
- `organizationId`: The Zoho organization ID
- `accountsServer`: The accounts server URL for Multi-DC support

### 6. Frontend Components

#### `app/dashboard/bills/page.tsx`
Main bills list page.

```typescript
interface BillsPageProps {}

export default function BillsPage() {
  // Fetch bills from API
  // Display loading state
  // Render bills table/cards
  // Handle pagination
  // Show empty state if no bills
}
```

#### `app/dashboard/bills/_components/bills-table.tsx`
Bills display component.

```typescript
interface BillsTableProps {
  bills: ZohoBill[];
  onRefresh: () => void;
}

export function BillsTable({ bills, onRefresh }: BillsTableProps) {
  // Render table with columns: Vendor, Bill #, Date, Due Date, Amount, Status
  // Format currency and dates
  // Apply status badges
  // Provide refresh button
}
```

#### Update `app/dashboard/integrations/page.tsx`
Add Zoho Books integration card.

```typescript
// Add to integrations array:
{
  name: "Zoho Books",
  description: "Fetch and view your business bills",
  status: isConnected ? "connected" : "available",
  icon: "📊",
  category: "Accounting",
}
```

## Data Models

### Bill Data Model

```typescript
interface Bill {
  id: string;
  vendorName: string;
  billNumber: string;
  referenceNumber: string;
  date: Date;
  dueDate: Date;
  status: BillStatus;
  amount: number;
  balance: number;
  currency: {
    code: string;
    symbol: string;
  };
  isOverdue: boolean;
}

type BillStatus = 'open' | 'paid' | 'void' | 'overdue';
```

### Integration Status Model

```typescript
interface IntegrationStatus {
  connected: boolean;
  organizationId?: string;
  lastSync?: Date;
  error?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: OAuth Flow Completion
*For any* valid authorization code received from Zoho, exchanging it for tokens should result in both an access token and refresh token being stored in the database.

**Validates: Requirements 1.3, 1.4**

### Property 2: Token Encryption
*For any* tokens stored in the database, retrieving and decrypting them should produce the original token values.

**Validates: Requirements 2.4**

### Property 3: Token Refresh on Expiry
*For any* expired access token, making an API request should automatically trigger a token refresh and retry the request successfully.

**Validates: Requirements 2.1, 2.2**

### Property 4: Bills Retrieval Success
*For any* authenticated user with valid tokens, fetching bills should return a list of bills or an empty array (never null or undefined).

**Validates: Requirements 3.1, 3.3**

### Property 5: Currency Formatting Consistency
*For any* bill amount, the displayed currency should match the format specified by the bill's currency code and symbol.

**Validates: Requirements 4.3**

### Property 6: Status Badge Mapping
*For any* bill status value from the API, there should be a corresponding visual badge with appropriate styling.

**Validates: Requirements 4.5**

### Property 7: Integration Status Accuracy
*For any* user, the integration status should accurately reflect whether valid tokens exist in the database.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 8: Token Deletion on Disconnect
*For any* user who disconnects the integration, all associated tokens should be removed from the database and no longer retrievable.

**Validates: Requirements 2.5**

### Property 9: Error Message Clarity
*For any* API error response, the system should map it to a user-friendly error message that provides actionable guidance.

**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

### Property 10: HTTPS Communication
*For all* API requests to Zoho Books, the protocol should be HTTPS.

**Validates: Requirements 8.1**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid authorization code
   - Token refresh failure
   - Expired refresh token
   - User action: Reconnect integration

2. **API Errors**
   - Rate limiting (HTTP 429)
   - Service unavailable (HTTP 503)
   - Invalid organization ID
   - User action: Retry later or contact support

3. **Permission Errors**
   - Insufficient scope
   - User action: Reconnect with proper permissions

4. **Network Errors**
   - Timeout
   - Connection refused
   - User action: Check internet connection, retry

### Error Response Format

```typescript
interface APIError {
  code: string;
  message: string;
  userMessage: string;
  action?: 'reconnect' | 'retry' | 'contact_support';
}
```

### Error Handling Strategy

1. Log all errors with context for debugging
2. Display user-friendly messages in UI
3. Provide actionable next steps
4. Implement exponential backoff for retries
5. Mark integration as "error" state when appropriate

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

- OAuth URL generation with correct parameters
- Token encryption/decryption round-trip
- Error message mapping for known error codes
- Currency formatting for different locales
- Date formatting edge cases (timezone handling)
- Empty bills list rendering
- Integration status determination logic

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using a testing library (e.g., `fast-check` for TypeScript). Each test will run a minimum of 100 iterations.

**Test Configuration:**
- Library: `fast-check` (TypeScript/JavaScript property-based testing)
- Minimum iterations: 100 per property
- Each test references its design document property

**Property Test Examples:**

```typescript
// Property 1: OAuth Flow Completion
test('Property 1: OAuth flow completion', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 20 }), // authorization code
      async (code) => {
        const tokens = await oauthService.exchangeCodeForTokens(code);
        expect(tokens.accessToken).toBeDefined();
        expect(tokens.refreshToken).toBeDefined();
        
        const stored = await tokenManager.getTokens(userId);
        expect(stored).not.toBeNull();
      }
    ),
    { numRuns: 100 }
  );
});

// Property 2: Token Encryption Round-Trip
test('Property 2: Token encryption', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        accessToken: fc.string({ minLength: 10 }),
        refreshToken: fc.string({ minLength: 10 }),
      }),
      async (tokens) => {
        await tokenManager.storeTokens(userId, tokens, orgId);
        const retrieved = await tokenManager.getTokens(userId);
        
        expect(retrieved.accessToken).toBe(tokens.accessToken);
        expect(retrieved.refreshToken).toBe(tokens.refreshToken);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 5: Currency Formatting
test('Property 5: Currency formatting consistency', () => {
  fc.assert(
    fc.property(
      fc.record({
        amount: fc.float({ min: 0, max: 1000000 }),
        currencyCode: fc.constantFrom('USD', 'EUR', 'GBP', 'INR'),
        currencySymbol: fc.constantFrom('$', '€', '£', '₹'),
      }),
      (bill) => {
        const formatted = formatCurrency(bill.amount, bill.currencyCode, bill.currencySymbol);
        expect(formatted).toContain(bill.currencySymbol);
        expect(formatted).toMatch(/\d/); // Contains digits
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

- Full OAuth flow from start to finish
- Bills fetching with real API (using test account)
- Token refresh flow when access token expires
- Error handling for various API failure scenarios

### Security Tests

- Verify tokens are encrypted in database
- Verify HTTPS is used for all API calls
- Verify no tokens in client-side code
- Verify proper CORS headers

## Implementation Notes

### Multi-DC Support

Zoho Books operates in multiple data centers (.com, .eu, .in, etc.). The OAuth callback includes a `location` parameter and `accounts-server` URL that indicates the user's data center. Store this information and use the appropriate API base URL for all subsequent requests.

### Token Encryption

Use a strong encryption algorithm (AES-256) with a secret key stored in environment variables. Never store tokens in plain text.

### Rate Limiting

Zoho Books API has rate limits. Implement exponential backoff and respect rate limit headers in responses.

### Pagination

The bills API supports pagination with `page` and `per_page` parameters. Default to 200 items per page and implement "Load More" or infinite scroll in the UI.

### Caching

Consider caching bill data for a short period (5-10 minutes) to reduce API calls and improve performance. Provide a manual refresh button for users who want fresh data.

### Environment Variables

```
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REDIRECT_URI=https://yourdomain.com/api/zoho/auth/callback
ZOHO_SCOPE=ZohoBooks.bills.READ
ENCRYPTION_KEY=your_encryption_key
```
