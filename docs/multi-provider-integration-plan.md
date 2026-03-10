# Multi-Provider Integration Plan

> **Goal**: Add Google Sheets OAuth + Excel file upload as invoice data sources alongside Zoho Books, in a way that is consistent, extensible, and requires minimal changes when adding future providers (Zoho Invoices, QuickBooks, OneDrive Excel, etc.).

---

## Architecture: Provider Adapter Pattern

Every integration implements a **single shared interface**. The rest of the app (reminders, cron, UI) never changes when a new provider is added.

```
lib/providers/
  types.ts                  ← Shared interfaces (InvoiceProvider, NormalizedInvoice, NormalizedCustomer)
  zoho-books.ts             ← Wraps existing ZohoAPIClient
  google-sheets.ts          ← New: fetches from Google Sheets API v4
  excel-upload.ts           ← New: parses uploaded .xlsx file
  index.ts                  ← Registry: { zoho_books, google_sheets, excel_upload }
```

Adding any future provider = **1 new file + 1 registry entry**. Zero changes elsewhere.

---

## Database: No Schema Changes Needed

The existing `agentIntegrations` table already supports all providers via the generic `config` JSON field:

| Column | Zoho Books | Google Sheets | Excel Upload | Future (Zoho Invoices) |
|--------|-----------|---------------|--------------|------------------------|
| `provider` | `zoho_books` | `google_sheets` | `excel_upload` | `zoho_invoices` |
| `integrationType` | `oauth` | `oauth` | `file_upload` | `oauth` |
| `accessToken` | ✅ OAuth token | ✅ OAuth token | ❌ null | ✅ OAuth token |
| `refreshToken` | ✅ | ✅ | ❌ null | ✅ |
| `config` JSON | `{ organizationId, apiDomain, accountsServer }` | `{ spreadsheetId, sheetName, headerMapping }` | `{ lastUploadedAt, rowCount }` | `{ organizationId, apiDomain }` |

All providers write normalized data into the same `invoicesCache` + `customersCache` tables → **reminder engine works untouched**.

---

## Phase 1: Provider Abstraction Layer

### Files to Create

#### `lib/providers/types.ts`
```ts
export interface NormalizedCustomer { /* matches customersCache */ }
export interface NormalizedInvoice  { /* matches invoicesCache  */ }

export interface InvoiceProvider {
  readonly providerName: string;
  getCustomers(userId: string): Promise<NormalizedCustomer[]>;
  getInvoices(userId: string): Promise<NormalizedInvoice[]>;
}
```

#### `lib/providers/zoho-books.ts`
Thin wrapper around the existing `ZohoAPIClient` — no logic change, just implements `InvoiceProvider`.

#### `lib/providers/index.ts`
```ts
export const providers: Record<string, InvoiceProvider> = {
  zoho_books: new ZohoBooksProvider(),
  google_sheets: new GoogleSheetsProvider(),
  excel_upload: new ExcelUploadProvider(),
};
```

---

## Phase 2: Google Sheets OAuth

### OAuth Flow (mirrors Zoho exactly)

```
User clicks "Connect"
  → GET /api/google-sheets/auth/connect
  → Redirect to accounts.google.com/o/oauth2/v2/auth
      params: client_id, redirect_uri, scope, response_type=code,
              access_type=offline, prompt=consent, state (CSRF)
  → Google redirects back to /api/google-sheets/auth/callback?code=...
  → Server exchanges code for tokens (POST https://oauth2.googleapis.com/token)
  → Tokens saved to agentIntegrations (encrypted, same as Zoho)
  → User redirected to /dashboard/integrations?success=google_sheets_connected
  → User pastes their Google Sheet URL → spreadsheetId extracted + saved to config
  → Daily cron fetches sheet data → writes to invoicesCache / customersCache
```

### New Files

| File | Description |
|------|-------------|
| `lib/google-oauth.ts` | Same shape as `zoho-oauth.ts`, ~100 lines |
| `lib/google-token-manager.ts` | Same shape as `zoho-token-manager.ts`, `provider = "google_sheets"` |
| `lib/google-sheets-client.ts` | Calls Sheets API v4 → returns `NormalizedInvoice[]` |
| `app/api/google-sheets/auth/connect/route.ts` | Same as zoho connect |
| `app/api/google-sheets/auth/callback/route.ts` | Same as zoho callback |
| `app/api/google-sheets/auth/disconnect/route.ts` | Same as zoho disconnect |
| `app/api/google-sheets/status/route.ts` | Same as zoho status |
| `app/api/google-sheets/set-sheet/route.ts` | **New**: saves spreadsheetId to config |

### Google OAuth vs Zoho OAuth — Key Differences

| | Zoho | Google |
|---|---|---|
| Auth URL | `accounts.zoho.com/oauth/v2/auth` | `accounts.google.com/o/oauth2/v2/auth` |
| Token URL | `{accountsServer}/oauth/v2/token` | `https://oauth2.googleapis.com/token` |
| Revoke URL | `{accountsServer}/oauth/v2/token/revoke` | `https://oauth2.googleapis.com/revoke` |
| `api_domain` in response | ✅ (Multi-DC) | ❌ (always `sheets.googleapis.com`) |
| Param names | Same | **100% identical** |
| Refresh flow | Same | **100% identical** |

### Required Env Vars
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://yourapp.com/api/google-sheets/auth/callback
```

### Google Sheet URL Parsing
```ts
// From: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
const spreadsheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
```

### Required Google Cloud Scope
```
https://www.googleapis.com/auth/spreadsheets.readonly
```
Read-only scope — minimal permission, easier for users to approve.

### Google Sheets API Call
```
GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{sheetName}
Authorization: Bearer {accessToken}
```
Returns rows as `string[][]` — map columns using `headerMapping` saved in config.

---

## Phase 3: Excel File Upload

### Flow
```
User clicks "Connect" on Excel card
  → Opens upload modal (not OAuth redirect)
  → User selects .xlsx file
  → POST /api/excel/import (multipart form)
  → Server parses file with SheetJS (xlsx package)
  → Data written to invoicesCache / customersCache
  → agentIntegrations row created with provider = "excel_upload"
  → "Connected" badge shown (same UI as Zoho/Google)
```

### New Files

| File | Description |
|------|-------------|
| `lib/excel-parser.ts` | Uses SheetJS to parse .xlsx → `NormalizedInvoice[]` |
| `app/api/excel/import/route.ts` | Accepts multipart upload, calls parser, writes to cache |

### Package to Add
```bash
pnpm add xlsx
```

---

## Phase 4: Integrations UI Update

### `app/dashboard/integrations/page.tsx` Changes

The `integrations` array currently has Zoho hardcoded. Change to a simple config array:

```ts
const AVAILABLE_INTEGRATIONS = [
  { id: "zoho_books",     name: "Zoho Books",     category: "Accounting", icon: "📚", connectType: "oauth" },
  { id: "google_sheets",  name: "Google Sheets",  category: "Accounting", icon: "📊", connectType: "oauth" },
  { id: "excel_upload",   name: "Excel Upload",   category: "Accounting", icon: "📁", connectType: "upload" },
  // Future: { id: "zoho_invoices", ... }
  // Future: { id: "quickbooks",    ... }
]
```

`handleConnect` dispatches based on `connectType`:
- `"oauth"` → redirect to `/api/{provider}/auth/connect`
- `"upload"` → open file upload modal

---

## Phase 5: Cron Sync Update

The existing cron worker syncs only Zoho. Update to loop all active integrations:

```ts
// cron-worker: for each active agentIntegration
const provider = providers[integration.provider];
if (provider) {
  const invoices = await provider.getInvoices(userId);
  await writeToInvoicesCache(invoices);
}
```

Note: `excel_upload` provider returns cached data (no re-fetch) — cron skips it or it's a no-op.

---

## Implementation Order

- [x] Understand existing Zoho architecture
- [ ] Create `lib/providers/types.ts` (shared interfaces)
- [ ] Create `lib/providers/zoho-books.ts` (wrap existing client)
- [ ] Create `lib/providers/index.ts` (registry)
- [ ] Create `lib/google-oauth.ts`
- [ ] Create `lib/google-token-manager.ts`
- [ ] Create `lib/google-sheets-client.ts`
- [ ] Create `app/api/google-sheets/auth/*` routes
- [ ] Create `app/api/google-sheets/set-sheet/route.ts`
- [ ] Update `app/dashboard/integrations/page.tsx` (add Google Sheets card + config array)
- [ ] Create `lib/excel-parser.ts` + install `xlsx`
- [ ] Create `app/api/excel/import/route.ts`
- [ ] Update cron worker to loop all providers
- [ ] Test full Google Sheets flow
- [ ] Test Excel upload flow
