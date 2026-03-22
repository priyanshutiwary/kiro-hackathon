# Nango Integration Module

This module provides utilities for integrating with Nango, a code-first integration platform for connecting to multiple invoicing and accounting software providers.

## Setup Complete ✅

The following components have been installed and configured:

### 1. SDKs Installed
- ✅ `@nangohq/node` - Backend SDK for server-side operations
- ✅ `@nangohq/frontend` - Frontend SDK for OAuth flows
- ✅ `nango` CLI - For deploying integration functions

### 2. Environment Configuration
- ✅ `NANGO_SECRET_KEY` added to `.env.example`
- ⚠️ **ACTION REQUIRED**: Add `NANGO_SECRET_KEY` to your `.env.local` file

### 3. Client Utilities
- ✅ `lib/nango/client.ts` - Nango client initialization
- ✅ `lib/nango/types.ts` - TypeScript type definitions
- ✅ `lib/nango/index.ts` - Module exports

## Next Steps

### 1. Add Your Nango Secret Key

Add the following line to your `.env.local` file:

```bash
# Nango Integration (Multi-Provider Invoice Sync)
# Get your secret key from https://nango.dev/dashboard (Settings → API Keys)
NANGO_SECRET_KEY=your_secret_key_here
```

To get your secret key:
1. Go to https://nango.dev
2. Sign up for a free account (no credit card required)
3. Navigate to Settings → API Keys
4. Copy your Secret Key (starts with `nango_secret_key_...`)

### 2. Usage Examples

#### Backend Usage

```typescript
import { getNangoClient, getConnectionId } from '@/lib/nango';

// Get the Nango client
const nango = getNangoClient();

// Generate a connection ID
const connectionId = getConnectionId(userId, 'quickbooks');

// Trigger an action
const result = await nango.triggerAction({
  connectionId,
  providerConfigKey: 'quickbooks',
  action: 'fetch-invoices',
  input: { startDate: '2024-01-01' }
});
```

#### Frontend Usage

```typescript
import Nango from '@nangohq/frontend';

// Get session token from backend
const { sessionToken } = await fetch('/api/nango/session').then(r => r.json());

// Initialize frontend SDK
const nango = new Nango({ connectSessionToken: sessionToken });

// Open OAuth connection UI
await nango.openConnectUI({
  providerConfigKey: 'quickbooks',
  connectionId: `${userId}_quickbooks`,
  onEvent: (event) => {
    if (event.type === 'connect') {
      console.log('Connected successfully!');
    }
  }
});
```

### 3. Available Scripts

```bash
# Run Nango CLI commands
pnpm nango --help

# Deploy Nango functions (after creating nango-integrations folder)
pnpm nango deploy dev
pnpm nango deploy prod

# Test Nango functions locally
pnpm nango dryrun
```

## Module Structure

```
lib/nango/
├── client.ts       # Nango client initialization and utilities
├── types.ts        # TypeScript type definitions
├── index.ts        # Module exports
└── README.md       # This file
```

## Key Features

- **Singleton Pattern**: Nango client is initialized once and reused
- **Type Safety**: Full TypeScript support with comprehensive types
- **Error Handling**: Clear error messages for missing configuration
- **Connection Management**: Utilities for generating and parsing connection IDs
- **Frontend Support**: Configuration helpers for frontend OAuth flows

## Documentation

- [Nango Documentation](https://docs.nango.dev)
- [Nango SDK Reference](https://docs.nango.dev/reference/sdk)
- [InvoCall Design Doc](../../.kiro/specs/nango-multi-provider-integration/design.md)

## Support

For issues or questions:
1. Check the [Nango Documentation](https://docs.nango.dev)
2. Review the [Design Document](../../.kiro/specs/nango-multi-provider-integration/design.md)
3. Contact the development team
