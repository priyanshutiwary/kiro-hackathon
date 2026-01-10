# Customer Sync Requirements

## Overview
Implement customer synchronization to cache Zoho Books customer data locally, enabling efficient invoice processing and reminder creation.

## Problem Statement
- Customer info duplicated in invoices_cache table
- Cannot fetch phone numbers (Zoho invoice list API doesn't include contact details)
- Inefficient API usage
- Difficulty updating customer information across invoices

## Goals
1. Create normalized customer cache table
2. Sync customer data from Zoho Books Contacts API
3. Refactor invoice sync to reference customers
4. Enable remindon only for customers with phone numbers
5. Support incremental customer sync

---

## Functional Requirements

### FR-1: Customer Cache Table (P0)
Create `customers_cache` table with:
- id, userId, zohoCustomerId
- customerName, companyName
- primaryContactPersonId, primaryPhone, primaryEmail
- contactPersons (jsonb array)
- zohoLastModifiedAt, localLastSyncedAt, syncHash
- createdAt, updatedAt

### FR-2: Customer Sync Engine (P0)er creati
- Fetch from Zoho Contacts API
- Incremental sync using last_modified_time
- Hash-based change detection
- Extract primary phone from contact_persons array
- Handle pagination

### FR-3: Refactor Invoice Schema (P0)
- Remove: customerName, customerPhone, customerCountryCode, customerTimezone
- Add: customerId (FK to customers_cache)
- Keep: zohoCustomerId (for lookup)

### FR-4: Sync Orchestration (P0)
1. Customer Sync Phase → 2. Invoice Sync Phase → 3. Reminder Creation Phase

### FR-5: Reminder Creation Update (P0)
- Use customer data from customers_cache via customerId FK
- Check customers_cache.primaryPhone instead of invoices_cache.customerPhone

### FR-6: Phone Extraction Logic (P0)
Priority: Primary contact mobile > Primary contact phone > First contact mobile > First contact phone

### FR-7: Error Handling (P1)
- Customer API failure: log, continue with cache
- Customer not found: log warning, skip invoice
- Invalid phone: store customer, skip reminder

### FR-8: Sync Metadata (P1)
Add lastCustomerSyncAt to syncMetadata table

---

## Technical Requirements

### TR-1: Zoho Contacts API Integration (P0)
Create ZohoContactsClient with getContacts() and getContactById()

### TR-2: Customer Hash Calculation (P0)
Hash includes: name, company, phone, email, contact_persons

### TR-3: Database Migrations (P0)
1. Create customers_cache
2. Add customerId to invoices_cache
3. Backfill customerId
4. Add FK constraint
5. Drop old columns

### TR-4: Performance (P1)
- Batch inserts (100 at a time)
- Database transactions
- Index foreign keys

### TR-5: Rate Limiting (P1)
Respect Zoho 100 req/min limit

### TR-6: Testing (P1)
Test new/updated/unchanged customers, missing customers, phone handling

---

## Success Criteria
- Customer data synced and cached
- Phone numbers extracted correctly
- Invoices reference customers via FK
- Reminders only for customers with phones
- 80%+ reduction in API calls
- No data loss during migration

---

## Migration Strategy
Phase 1: Add customer cache (no breaking changes)
Phase 2: Update invoice sync (backward compatible)
Phase 3: Cleanup (drop old columns)

---

## Timeline: 4-6 days
