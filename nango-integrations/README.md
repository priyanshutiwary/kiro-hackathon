# Nango Integrations

This folder contains Nango integration functions for connecting InvoCall with multiple invoicing platforms.

## Structure

```
nango-integrations/
├── .nango/                    # Nango CLI metadata (auto-generated)
├── build/                     # Compiled integration functions (auto-generated)
├── shared/                    # Shared types and utilities
│   ├── types.ts              # NormalizedCustomer, NormalizedInvoice types
│   ├── normalizers.ts        # Common normalization functions
│   └── utils.ts              # Utility functions
├── placeholder/              # Placeholder action (will be removed)
├── index.ts                  # Entry point - exports all integrations
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
└── .env                      # Local environment variables
```

## Setup

The nango-integrations folder has been initialized with:

1. **Shared Types** (`shared/types.ts`):
   - `NormalizedCustomer`: Standard customer data structure
   - `NormalizedInvoice`: Standard invoice data structure

2. **Shared Normalizers** (`shared/normalizers.ts`):
   - Date normalization
   - Currency code normalization
   - Phone number normalization
   - Email normalization
   - Invoice status determination

3. **Shared Utils** (`shared/utils.ts`):
   - Query string builder
   - Pagination helper
   - Retry with backoff
   - Date formatting
   - Array chunking

## Development

### Compile integrations
```bash
pnpm compile
```

### Watch mode (auto-compile on changes)
```bash
pnpm dev
```

### Deploy to Nango
```bash
nango deploy <environment>
```

## Adding a New Provider

1. Create provider folder: `mkdir -p <provider>/actions`
2. Create fetch-invoices action: `<provider>/actions/fetch-invoices.ts`
3. Create fetch-customers action: `<provider>/actions/fetch-customers.ts`
4. Import actions in `index.ts`
5. Compile and test: `pnpm compile`
6. Deploy: `nango deploy dev`

## Environment Variables

The `.env` file in this folder is for local development only. It should contain:

```
# Add any provider-specific API keys or configuration here
# These are only used for local testing with `nango dev`
```

For production, environment variables are managed through the Nango dashboard.

## Notes

- All provider integrations must normalize data to the `NormalizedCustomer` and `NormalizedInvoice` types
- Use the shared normalizers and utils to maintain consistency
- The placeholder action will be removed once actual provider integrations are added
- This folder is version controlled (not in .gitignore)
- Build artifacts and node_modules are gitignored
