# Customer Sync Feature - Design Spec

## Overview
Separate customer data from invoices by creating a dedicated customer cache table. Sync customers independently from invoices to reduce API calls and improve data normalization.

## Problem
- Customer data (name, phone) duplicated across all invoices
- Phone numbers not available from Zoho invoice list API
- Need to fetch full invoice details for each invoice (expensive)
- Data inconsistency when customer info changes

## Solution
Create `customers_cache` table and sync customers separately from invoices using Zoho Contacts API.

## Database Schema

### New Table: `customers_cache`
```typescript
{
  id: uuid (PK)
  userId: string (FK to users)
  zohoCustomerId: string (indexed)
  customerName: string
  primaryPhone: string | null
  primaryEmail: string | null
  contactPersons: jsonb[] // Array of contact person objects
  zohoLastModifiedAt: timestamp
  localLastSyncedAt: timestamp
  syncHash: string // For change detection
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Updated Table: `invoices_cache`
**Remove fields:**
- customerName
- customerPhone
- customerCountryCode
- customerTimezone

**Add field:**
- customerId: uuid (FK to customers_cache)

## API Integration

### Zoho Contacts API
- **Endpoint:** `/contacts`
- **Filters:** `last_modified_time` for incremental sync
- **Data:** Contact persons with phone/mobile numbers

### Contact Person Structure
```typescript
{
  contact_id: string
  contact_name: string
  contact_persons: [{
    contact_person_id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    mobile: string
    is_primary_contact: boolean
  }]
  last_modified_time: string
}
```

## Sync Flow

### 1. Customer Sync (Before Invoice Sync)
```
1. Fetch customers from Zoho Contacts API
2. For each customer:
   - Calculate hash from customer data
   - Check if exists in customers_cache
   - If new: Insert
   - If exists & changed: Update
   - If exists & unchanged: Update sync timestamp only
3. Extract primary phone from contact_persons array
4. Store all contact persons in jsonb field
```

### 2. Invoice Sync (Modified)
```
1. Fetch invoices from Zoho
2. For each invoice:
   - Look up customerId from customers_cache using zohoCustomerId
   - If customer not found: Log warning, skip reminder creation
   - If customer found: Create invoice with customerId reference
3. Create reminders only if customer has phone number
```

### 3. Reminder Creation (Modified)
```
1. Join invoices_cache with customers_cache
2. Check if customer.primaryPhone exists
3. If yes: Create reminders
4. If no: Skip and log
```

## Change Detection

### Customer Hash Calculation
```typescript
hash = SHA256(
  contact_id +
  contact_name +
  primary_contact_person.phone +
  primary_contact_person.mobile +
  primary_contact_person.email +
  last_modified_time
)
```

## Sync Metadata

Add to `sync_metadata` table:
- `lastCustomerSyncAt: timestamp`
- `customerSyncWindowDays: number` (default: 365)

## Benefits

1. **Performance:** Fewer API calls (only sync customers when changed)
2. **Normalization:** No duplicate customer data
3. **Flexibility:** Easy to update customer phone manually
4. **Scalability:** Better for large invoice volumes
5. **Data Integrity:** Single source of truth for customer info

## Edge Cases

1. **Customer not found:** Skip invoice, log warning
2. **No phone number:** Create invoice but skip reminders
3. **Multiple contact persons:** Use primary, store all in jsonb
4. **Customer deleted in Zoho:** Keep in cache (soft delete pattern)
5. **Phone number changes:** Updates all related invoices automatically

## Implementation Order

1. Create `customers_cache` table schema
2. Build `customer-sync-engine.ts`
3. Create `zoho-contacts-client.ts`
4. Update `sync-engine.ts` to call customer sync first
5. Modify invoice sync to use customer references
6. Update reminder creation to join with customers
7. Add migration script for existing data

## API Endpoints (No Changes)
Existing endpoints continue to work. Customer data joined transparently.

## Testing Strategy

1. Unit tests for customer sync engine
2. Integration tests for customer + invoice sync
3. Test phone number extraction logic
4. Test missing customer scenarios
5. Test customer update propagation
