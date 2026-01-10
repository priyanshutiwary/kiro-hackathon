# Customer Sync - Implementation Tasks

## Phase 1: Database Schema
- [ ] Add `customers_cache` table to schema.ts
- [ ] Add foreign key relationship: invoices_cache.customerId → customers_cache.id
- [ ] Remove customer fields from invoices_cache (customerName, customerPhone, etc.)
- [ ] Add indexes: (userId, zohoCustomerId), (userId, primaryPhone)
- [ ] Update sync_metadata table with customer sync fields
- [ ] Create and run database migration

## Phase 2: Zoho Contacts Client
- [ ] Create `lib/payment-reminders/zoho-contacts-client.ts`
- [ ] Implement `getContacts()` with filtering support
- [ ] Implement `getContactById()` for single contact fetch
- [ ] Add contact person extraction logic
- [ ] Add primary phone number detection (mobile > phone priority)
- [ ] Handle pagination for large contact lists
- [ ] Add error handling and retry logic

## Phase 3: Customer Sync Engine
- [ ] Create `lib/payment-reminders/customer-sync-engine.ts`
- [ ] Implement `syncCustomersForUser()` main function
- [ ] Implement `processAndUpsertCustomer()` for change detection
- [ ] Implement `calculateCustomerHash()` for change detection
- [ ] Implement `extractPrimaryPhone()` helper
- [ ] Add incremental sync support (last_modified_time)
- [ ] Add logging for sync operations

## Phase 4: Update Invoice Sync
- [ ] Modify `sync-engine.ts` to call customer sync first
- [ ] Update `processAndUpsertInvoice()` to use customerId reference
- [ ] Remove customer data extraction from invoice processing
- [ ] Add customer lookup logic (zohoCustomerId → customerId)
- [ ] Handle missing customer scenarios
- [ ] Update invoice hash calculation (remove customer fields)

## Phase 5: Update Reminder Creation
- [ ] Modify `createRemindersForInvoice()` to join with customers_cache
- [ ] Update phone number check to use customer.primaryPhone
- [ ] Update logging to show customer info
- [ ] Handle missing customer gracefully

## Phase 6: API & UI Updates
- [ ] Update `/api/invoices/route.ts` to join with customers
- [ ] Update `/api/reminders/route.ts` to include customer data
- [ ] Update invoice display components to show customer info
- [ ] Update reminder display components to show customer phone

## Phase 7: Data Migration
- [ ] Create migration script to populate customers_cache from existing invoices
- [ ] Deduplicate customer records
- [ ] Update existing invoice records with customerId references
- [ ] Verify data integrity after migration

## Phase 8: Testing
- [ ] Unit tests for customer sync engine
- [ ] Unit tests for Zoho contacts client
- [ ] Integration test: customer + invoice sync together
- [ ] Test phone number extraction from contact persons
- [ ] Test missing customer scenarios
- [ ] Test customer update propagation to invoices
- [ ] Test incremental sync for customers

## Phase 9: Documentation
- [ ] Create `CUSTOMER_SYNC_README.md`
- [ ] Update main README with customer sync info
- [ ] Document customer data structure
- [ ] Add troubleshooting guide
- [ ] Update API documentation

## Phase 10: Deployment
- [ ] Run database migration in production
- [ ] Deploy customer sync code
- [ ] Monitor first customer sync run
- [ ] Verify phone numbers are populated
- [ ] Verify reminders are created correctly
