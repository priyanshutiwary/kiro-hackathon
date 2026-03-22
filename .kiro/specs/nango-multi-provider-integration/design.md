# Nango Multi-Provider Integration - Technical Design

## Overview

This document outlines the technical design for integrating Nango into InvoCall to support multiple invoicing platforms through a code-first integration approach.

## Architecture Principles

1. **Code-First**: Integration logic written as TypeScript functions, version-controlled in git
2. **Hybrid Approach**: Maintain existing custom integrations while adding Nango-based providers
3. **Zero Disruption**: Existing users experience no downtime during migration
4. **Abstraction Layer**: All providers implement the same `InvoiceProvider` interface
5. **Gradual Migration**: Migrate existing providers (Zoho) only after proving Nango works

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         InvoCall Application                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Provider Abstraction Layer                   │  │
│  │         (InvoiceProvider Interface)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│          ┌───────────────┴───────────────┐                     │
│          │                               │                      │
│  ┌───────▼────────┐            ┌────────▼──────────┐          │
│  │ Custom         │            │ Nango             │          │
│  │ Providers      │            │ Providers         │          │
│  ├────────────────┤            ├───────────────────┤          │
│  │ • Zoho Books*  │            │ • QuickBooks      │          │
│  │ • Google       │            │ • Xero            │          │
│  │   Sheets       │            │ • FreshBooks      │          │
│  │ • Excel Upload │            │ • Zoho Books*     │          │
│  └────────────────┘            │ • Wave            │          │
│                                 │ • Sage            │          │
│                                 │ • 10+ more        │          │
│                                 └───────────────────┘          │
│                                          │                      │
│                                          │                      │
└──────────────────────────────────────────┼──────────────────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │   Nango Platform       │
                              ├────────────────────────┤
                              │ • OAuth Management     │
                              │ • Token Refresh        │
                              │ • Rate Limiting        │
                              │ • API Proxy            │
                              │ • Function Runtime     │
                              │ • Observability        │
                              └────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                       │
                    ▼                      ▼                       ▼
            ┌───────────────┐     ┌───────────────┐      ┌──────────────┐
            │  QuickBooks   │     │     Xero      │      │  FreshBooks  │
            │     API       │     │     API       │      │     API      │
            └───────────────┘     └───────────────┘      └──────────────┘

* Zoho Books will exist in both during migration period
```

## Component Design

### 1. Nango Integration Layer

#### 1.1 Nango Integrations Folder Structure

```
nango-integrations/
├── .nango/                    # Nango CLI metadata
├── .env                       # Local development env vars
├── index.ts                   # Export all integrations
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
│
├── quickbooks/
│   └── actions/
│       ├── fetch-invoices.ts
│       └── fetch-customers.ts
│
├── xero/
│   └── actions/
│       ├── fetch-invoices.ts
│       └── fetch-customers.ts
│
├── freshbooks/
│   └── actions/
│       ├── fetch-invoices.ts
│       └── fetch-customers.ts
│
└── shared/
    ├── types.ts               # Shared TypeScript types
    ├── normalizers.ts         # Common normalization functions
    └── utils.ts               # Utility functions
```

#### 1.2 Nango Action Structure

Each provider has two actions:

**fetch-invoices.ts**
```typescript
import { createAction } from 'nango';
import * as z from 'zod';
import { NormalizedInvoice } from '../shared/types';

export default createAction({
  description: 'Fetches invoices from QuickBooks',
  version: '1.0.0',
  input: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  output: z.array(NormalizedInvoice),
  exec: async (nango, input) => {
    // 1. Fetch invoices from QuickBooks API
    const response = await nango.get({
      endpoint: '/v3/company/{companyId}/query',
      params: {
        query: `SELECT * FROM Invoice WHERE TxnDate >= '${input.startDate}'`
      }
    });

    // 2. Normalize to InvoCall format
    const invoices = response.data.QueryResponse.Invoice.map(normalizeInvoice);

    // 3. Log for observability
    await nango.log(`Fetched ${invoices.length} invoices`);

    return invoices;
  }
});
```

**fetch-customers.ts**
```typescript
import { createAction } from 'nango';
import * as z from 'zod';
import { NormalizedCustomer } from '../shared/types';

export default createAction({
  description: 'Fetches customers from QuickBooks',
  version: '1.0.0',
  input: z.void(),
  output: z.array(NormalizedCustomer),
  exec: async (nango) => {
    // 1. Fetch customers from QuickBooks API
    const response = await nango.get({
      endpoint: '/v3/company/{companyId}/query',
      params: {
        query: 'SELECT * FROM Customer'
      }
    });

    // 2. Normalize to InvoCall format
    const customers = response.data.QueryResponse.Customer.map(normalizeCustomer);

    // 3. Log for observability
    await nango.log(`Fetched ${customers.length} customers`);

    return customers;
  }
});
```

### 2. Provider Implementation

#### 2.1 NangoProviderBase Abstract Class

```typescript
// lib/providers/nango-base.ts
import { Nango } from '@nangohq/node';
import type { InvoiceProvider, NormalizedCustomer, NormalizedInvoice } from './types';

export abstract class NangoProviderBase implements InvoiceProvider {
  protected nango: Nango;
  abstract providerName: string;
  abstract integrationId: string; // Nango integration ID

  constructor() {
    this.nango = new Nango({ 
      secretKey: process.env.NANGO_SECRET_KEY! 
    });
  }

  async getCustomers(userId: string): Promise<NormalizedCustomer[]> {
    try {
      const connectionId = this.getConnectionId(userId);
      
      // Trigger Nango action
      const result = await this.nango.triggerAction({
        connectionId,
        providerConfigKey: this.integrationId,
        action: 'fetch-customers',
        input: {}
      });

      return result as NormalizedCustomer[];
    } catch (error) {
      throw new ProviderError(`Failed to fetch customers: ${error.message}`);
    }
  }

  async getInvoices(userId: string, startDate?: Date): Promise<NormalizedInvoice[]> {
    try {
      const connectionId = this.getConnectionId(userId);
      
      // Trigger Nango action
      const result = await this.nango.triggerAction({
        connectionId,
        providerConfigKey: this.integrationId,
        action: 'fetch-invoices',
        input: {
          startDate: startDate?.toISOString()
        }
      });

      return result as NormalizedInvoice[];
    } catch (error) {
      throw new ProviderError(`Failed to fetch invoices: ${error.message}`);
    }
  }

  private getConnectionId(userId: string): string {
    // Connection ID format: {userId}_{providerName}
    return `${userId}_${this.providerName}`;
  }

  async checkConnection(userId: string): Promise<boolean> {
    try {
      const connectionId = this.getConnectionId(userId);
      const connection = await this.nango.getConnection(
        this.integrationId,
        connectionId
      );
      return connection !== null;
    } catch {
      return false;
    }
  }
}
```

#### 2.2 QuickBooks Provider Implementation

```typescript
// lib/providers/quickbooks.ts
import { NangoProviderBase } from './nango-base';

export class QuickBooksProvider extends NangoProviderBase {
  providerName = 'quickbooks';
  integrationId = 'quickbooks'; // Must match Nango dashboard
}
```

#### 2.3 Provider Registry

```typescript
// lib/providers/index.ts
import { ZohoBooksProvider } from './zoho-books';
import { GoogleSheetsProvider } from './google-sheets';
import { ExcelUploadProvider } from './excel-upload';
import { QuickBooksProvider } from './quickbooks';
import { XeroProvider } from './xero';
import { FreshBooksProvider } from './freshbooks';

const providers = {
  'zoho-books': new ZohoBooksProvider(),
  'google-sheets': new GoogleSheetsProvider(),
  'excel-upload': new ExcelUploadProvider(),
  'quickbooks': new QuickBooksProvider(),
  'xero': new XeroProvider(),
  'freshbooks': new FreshBooksProvider(),
};

export function getProvider(providerName: string): InvoiceProvider {
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Provider ${providerName} not found`);
  }
  return provider;
}
```

### 3. OAuth Flow

#### 3.1 Frontend OAuth Initiation

```typescript
// app/dashboard/integrations/page.tsx
import Nango from '@nangohq/frontend';

const nango = new Nango({ 
  connectSessionToken: sessionToken // From backend
});

async function connectProvider(providerName: string) {
  try {
    // Open Nango OAuth UI
    const result = await nango.openConnectUI({
      providerConfigKey: providerName,
      connectionId: `${userId}_${providerName}`,
      onEvent: (event) => {
        if (event.type === 'connect') {
          // Connection successful
          handleConnectionSuccess(providerName);
        } else if (event.type === 'error') {
          // Connection failed
          handleConnectionError(event.error);
        }
      }
    });
  } catch (error) {
    console.error('OAuth failed:', error);
  }
}
```

#### 3.2 Backend Session Token Generation

```typescript
// app/api/nango/session/route.ts
import { Nango } from '@nangohq/node';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });
  
  // Generate session token for frontend
  const sessionToken = await nango.createConnectSession({
    endUserId: session.user.id,
  });

  return Response.json({ sessionToken });
}
```

#### 3.3 Post-Connection Webhook

```typescript
// app/api/nango/webhook/route.ts
import { Nango } from '@nangohq/node';
import { db } from '@/db/drizzle';
import { agentIntegrations } from '@/db/schema';

export async function POST(request: Request) {
  const payload = await request.json();

  if (payload.type === 'connection.created') {
    const { connectionId, providerConfigKey } = payload;
    const [userId, providerName] = connectionId.split('_');

    // Store integration in database
    await db.insert(agentIntegrations).values({
      userId,
      provider: providerName,
      status: 'connected',
      metadata: { connectionId, providerConfigKey },
      createdAt: new Date(),
    });

    // Trigger initial sync
    await triggerSync(userId, providerName);
  }

  return Response.json({ success: true });
}
```

### 4. Data Normalization

#### 4.1 Normalized Data Types

```typescript
// lib/providers/types.ts
export interface NormalizedCustomer {
  externalId: string;
  customerName: string;
  companyName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  contactPersons?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
}

export interface NormalizedInvoice {
  externalId: string;
  externalCustomerId: string;
  invoiceNumber: string;
  amountTotal: number;
  amountDue: number;
  currencyCode: string;
  dueDate: Date;
  status: 'paid' | 'unpaid' | 'overdue';
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}
```

#### 4.2 QuickBooks Normalization

```typescript
// nango-integrations/quickbooks/actions/normalizers.ts
export function normalizeInvoice(qbInvoice: any): NormalizedInvoice {
  return {
    externalId: qbInvoice.Id,
    externalCustomerId: qbInvoice.CustomerRef.value,
    invoiceNumber: qbInvoice.DocNumber,
    amountTotal: qbInvoice.TotalAmt,
    amountDue: qbInvoice.Balance,
    currencyCode: qbInvoice.CurrencyRef?.value || 'USD',
    dueDate: new Date(qbInvoice.DueDate),
    status: qbInvoice.Balance > 0 ? 'unpaid' : 'paid',
    items: qbInvoice.Line?.map((line: any) => ({
      description: line.Description,
      quantity: line.SalesItemLineDetail?.Qty || 1,
      rate: line.SalesItemLineDetail?.UnitPrice || 0,
      amount: line.Amount,
    })),
  };
}

export function normalizeCustomer(qbCustomer: any): NormalizedCustomer {
  return {
    externalId: qbCustomer.Id,
    customerName: qbCustomer.DisplayName,
    companyName: qbCustomer.CompanyName,
    primaryEmail: qbCustomer.PrimaryEmailAddr?.Address,
    primaryPhone: qbCustomer.PrimaryPhone?.FreeFormNumber,
    contactPersons: qbCustomer.GivenName ? [{
      name: `${qbCustomer.GivenName} ${qbCustomer.FamilyName}`,
      email: qbCustomer.PrimaryEmailAddr?.Address,
      phone: qbCustomer.PrimaryPhone?.FreeFormNumber,
    }] : [],
  };
}
```

### 5. Sync Engine Integration

The existing sync engine remains unchanged:

```typescript
// lib/sync-engine.ts
export async function syncGenericProviderForUser(
  userId: string,
  providerName: string
) {
  const provider = getProvider(providerName);
  
  // Fetch customers
  const customers = await provider.getCustomers(userId);
  await saveCustomersToCache(userId, customers);
  
  // Fetch invoices
  const invoices = await provider.getInvoices(userId);
  await saveInvoicesToCache(userId, invoices);
  
  // Create reminders for unpaid invoices
  await createRemindersForUnpaidInvoices(userId, invoices);
}
```

### 6. Migration Strategy

#### 6.1 Zoho Books Migration

```typescript
// lib/providers/zoho-books-nango.ts
export class ZohoBooksNangoProvider extends NangoProviderBase {
  providerName = 'zoho-books';
  integrationId = 'zoho-books';
}

// Feature flag check
export function getZohoBooksProvider(userId: string): InvoiceProvider {
  const useNango = checkFeatureFlag(userId, 'use-nango-zoho');
  
  if (useNango) {
    return new ZohoBooksNangoProvider();
  } else {
    return new ZohoBooksProvider(); // Custom implementation
  }
}
```

#### 6.2 Migration Phases

1. **Phase 1**: Deploy Nango Zoho provider (disabled)
2. **Phase 2**: Enable for 10% of users (beta)
3. **Phase 3**: Monitor for 48 hours
4. **Phase 4**: Gradually roll out to 25%, 50%, 75%, 100%
5. **Phase 5**: Remove custom Zoho implementation

### 7. Error Handling

```typescript
// lib/providers/errors.ts
export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class NangoError extends ProviderError {
  constructor(message: string, provider: string, retryable: boolean = false) {
    super(message, provider, 'NANGO_ERROR', retryable);
  }
}

// Error handling in sync
try {
  await syncGenericProviderForUser(userId, providerName);
} catch (error) {
  if (error instanceof ProviderError && error.retryable) {
    // Retry with exponential backoff
    await retryWithBackoff(() => syncGenericProviderForUser(userId, providerName));
  } else {
    // Log error and notify user
    await logError(error);
    await notifyUser(userId, error.message);
  }
}
```

### 8. Deployment

#### 8.1 Nango Functions Deployment

```bash
# Deploy all functions to dev environment
nango deploy dev

# Deploy specific provider
nango deploy --action quickbooks/fetch-invoices dev

# Deploy to production
nango deploy prod
```

#### 8.2 CI/CD Integration

```yaml
# .github/workflows/deploy-nango.yml
name: Deploy Nango Functions

on:
  push:
    branches: [main]
    paths:
      - 'nango-integrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm nango deploy prod
        env:
          NANGO_SECRET_KEY: ${{ secrets.NANGO_SECRET_KEY }}
```

## Data Flow

### Invoice Sync Flow

```
1. Cron Job Triggers
   └─> syncGenericProviderForUser(userId, 'quickbooks')

2. Get Provider Instance
   └─> getProvider('quickbooks') → QuickBooksProvider

3. Fetch Invoices
   └─> provider.getInvoices(userId)
       └─> nango.triggerAction('fetch-invoices')
           └─> Nango executes quickbooks/actions/fetch-invoices.ts
               └─> Calls QuickBooks API
               └─> Normalizes data
               └─> Returns NormalizedInvoice[]

4. Save to Database
   └─> saveInvoicesToCache(userId, invoices)
       └─> Insert/update invoicesCache table

5. Create Reminders
   └─> createRemindersForUnpaidInvoices(userId, invoices)
       └─> Insert reminders table
```

## Security Considerations

1. **Credential Storage**: Nango stores OAuth tokens encrypted at rest
2. **API Key Security**: Nango secret key stored in environment variables
3. **Connection Isolation**: Each user has separate connection ID
4. **HTTPS Only**: All API calls over TLS 1.3
5. **Token Refresh**: Nango handles automatic token refresh
6. **Audit Logging**: All Nango operations logged with full context

## Performance Considerations

1. **Nango Overhead**: < 100ms per API call
2. **Concurrent Syncs**: Nango auto-scales to handle concurrent requests
3. **Rate Limiting**: Nango handles provider rate limits automatically
4. **Caching**: Nango caches responses where appropriate
5. **Pagination**: Nango helpers for paginated APIs

## Monitoring & Observability

1. **Nango Logs**: Full-text searchable logs for all operations
2. **Custom Logs**: `await nango.log()` for custom messages
3. **OpenTelemetry**: Export traces to observability platform
4. **Metrics**: Track latency, error rate, success rate
5. **Alerts**: Set up alerts for high error rates

## Testing Strategy

1. **Unit Tests**: Test normalization functions
2. **Integration Tests**: Test with Nango sandbox
3. **Local Testing**: Use `nango dryrun` for local testing
4. **Staging Environment**: Test with real provider accounts
5. **Production Monitoring**: Monitor metrics after deployment

## Rollback Plan

If issues occur:
1. Disable Nango provider via feature flag
2. Revert to custom implementation
3. Investigate and fix issues
4. Re-enable gradually

## Future Enhancements

1. **Webhooks**: Real-time updates via Nango webhooks
2. **Write-Back**: Mark invoices as paid in provider
3. **Unified API**: Single API across all providers
4. **Custom Field Mapping**: Per-customer field mappings
5. **Multi-Org Support**: Multiple integrations per user
