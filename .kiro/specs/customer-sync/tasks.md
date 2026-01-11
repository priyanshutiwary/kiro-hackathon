# Implementation Plan: Customer Sync

## Overview

This implementation plan transforms the customer sync design into actionable coding tasks. The approach follows a phased migration strategy to minimize risk:

1. **Phase 1:** Create customer cache infrastructure (non-breaking)
2. **Phase 2:** Implement customer sync engine and integrate with invoice sync
3. **Phase 3:** Refactor invoice schema and migrate data
4. **Phase 4:** Update reminder creation to use customer data

Each task builds incrementally, ensuring the system remains functional throughout the migration.

## Tasks

- [x] 1. Create customer cache database schema
  - Add `customers_cache` table to `db/schema.ts` with all required fields
  - Include indexes on `userId`, `zohoCustomerId`, and composite `(userId, zohoCustomerId)`
  - Add `lastCustomerSyncAt` field to `syncMetadata` table
  - _Requirements: FR-1, TR-3_

- [x] 2. Generate and run database migration
  - Run `npm run db:generate` to create migration files
  - Review generated migration SQL
  - Run `npm run db:push` to apply migration to database
  - Verify tables created successfully
  - _Requirements: TR-3_

- [x] 3. Implement Zoho Contacts API client
  - [x] 3.1 Create `zoho-contacts-client.ts` in `lib/payment-reminders/`
    - Implement `ZohoContactsClient` class with `getContacts()` method
    - Support pagination and `last_modified_time` filtering for incremental sync
    - Implement `getContactById()` for single contact fetching
    - Handle Zoho API response format and error cases
    - _Requirements: TR-1, FR-2_

  - [ ]* 3.2 Write unit tests for Zoho Contacts client
    - Test successful contact fetching with pagination
    - Test incremental sync with `last_modified_time` filter
    - Test error handling for API failures
    - Test contact person data extraction
    - _Requirements: TR-6_

- [x] 4. Implement customer hash calculation
  - [x] 4.1 Create `customer-hash.ts` in `lib/payment-reminders/`
    - Implement `calculateCustomerHash()` function
    - Hash includes: contact_id, contact_name, primary phone, primary email, last_modified_time
    - Use SHA-256 for hash calculation (consistent with invoice hash)
    - Implement `detectCustomerChanges()` to compare old vs new customer data
    - _Requirements: TR-2, FR-2_

  - [ ]* 4.2 Write unit tests for customer hash calculation
    - Test hash consistency for same input
    - Test hash changes when customer data changes
    - Test change detection logic
    - _Requirements: TR-6_

- [x] 5. Implement phone extraction logic
  - [x] 5.1 Create `phone-extractor.ts` in `lib/payment-reminders/`
    - Implement `extractPrimaryPhone()` function
    - Priority: Primary contact mobile > Primary contact phone > First contact mobile > First contact phone
    - Handle missing or invalid phone numbers gracefully
    - Return null if no valid phone found
    - _Requirements: FR-6_

  - [ ]* 5.2 Write unit tests for phone extraction
    - Test priority order (primary mobile, primary phone, first mobile, first phone)
    - Test missing contact persons array
    - Test no phone numbers available
    - Test multiple contact persons
    - _Requirements: TR-6_

- [x] 6. Implement customer sync engine
  - [x] 6.1 Create `customer-sync-engine.ts` in `lib/payment-reminders/`
    - Implement `syncCustomersForUser()` main function
    - Fetch customers from Zoho Contacts API with pagination
    - Calculate hash for each customer
    - Check if customer exists in cache (by userId + zohoCustomerId)
    - Insert new customers, update changed customers, touch unchanged customers
    - Extract and store primary phone using phone extraction logic
    - Store all contact_persons in jsonb field
    - Handle errors gracefully (log and continue)
    - _Requirements: FR-2, FR-6, FR-7_

  - [ ]* 6.2 Write unit tests for customer sync engine
    - Test new customer insertion
    - Test existing customer update when changed
    - Test existing customer timestamp update when unchanged
    - Test phone extraction integration
    - Test error handling for API failures
    - _Requirements: TR-6_

- [x] 7. Checkpoint - Verify customer sync works independently
  - Run customer sync manually to test
  - Verify customers are inserted into `customers_cache` table
  - Verify phone numbers are extracted correctly
  - Verify hash-based change detection works
  - Ask user if any issues arise

- [x] 8. Update sync orchestration to include customer sync
  - [x] 8.1 Modify `sync-engine.ts` to call customer sync first
    - Add customer sync phase before invoice sync
    - Call `syncCustomersForUser()` at start of `syncInvoicesForUser()`
    - Update sync metadata with `lastCustomerSyncAt` timestamp
    - Handle customer sync errors gracefully (log but continue with invoice sync)
    - _Requirements: FR-4_

  - [ ]* 8.2 Write integration tests for sync orchestration
    - Test customer sync runs before invoice sync
    - Test sync continues if customer sync fails
    - Test sync metadata is updated correctly
    - _Requirements: TR-6_

- [x] 9. Add customerId to invoices_cache schema
  - Update `invoicesCache` table in `db/schema.ts`
  - Add `customerId` field as nullable text (FK to customers_cache)
  - Keep `zohoCustomerId` field for lookup during migration
  - Generate and run migration
  - _Requirements: FR-3, TR-3_

- [x] 10. Update invoice sync to reference customers
  - [x] 10.1 Modify `processAndUpsertInvoice()` in `sync-engine.ts`
    - Look up `customerId` from `customers_cache` using `zohoCustomerId`
    - If customer not found, log warning and set `customerId` to null
    - Store `customerId` in invoice record
    - Remove direct storage of customer name and phone (keep for backward compatibility during migration)
    - _Requirements: FR-3, FR-4, FR-7_

  - [ ]* 10.2 Write unit tests for updated invoice sync
    - Test invoice with existing customer (customerId set)
    - Test invoice with missing customer (customerId null, warning logged)
    - Test backward compatibility with existing invoices
    - _Requirements: TR-6_

- [x] 11. Checkpoint - Verify invoice sync with customer references
  - Run full sync (customers + invoices)
  - Verify invoices have `customerId` populated
  - Verify missing customers are handled gracefully
  - Check logs for any warnings
  - Ask user if any issues arise

- [x] 12. Update reminder creation to use customer data
  - [x] 12.1 Modify `createRemindersForInvoice()` in `sync-engine.ts`
    - Join with `customers_cache` table to get customer data
    - Check `customers_cache.primaryPhone` instead of `invoicesCache.customerPhone`
    - Skip reminder creation if customer not found or no phone
    - Log appropriate messages for skipped reminders
    - _Requirements: FR-5, FR-7_

  - [ ]* 12.2 Write unit tests for updated reminder creation
    - Test reminder creation with customer phone
    - Test reminder skipping when customer has no phone
    - Test reminder skipping when customer not found
    - Test logging for skipped reminders
    - _Requirements: TR-6_

- [x] 13. Create data migration script for existing invoices
  - [x] 13.1 Create `scripts/migrate-customer-data.ts`
    - Backfill `customerId` for existing invoices using `zohoCustomerId`
    - Match invoices to customers in `customers_cache`
    - Log invoices that couldn't be matched
    - Run in batches to avoid memory issues
    - _Requirements: TR-3_

  - [ ]* 13.2 Test migration script on sample data
    - Test with invoices that have matching customers
    - Test with invoices that have no matching customers
    - Verify data integrity after migration
    - _Requirements: TR-6_

- [ ] 14. Checkpoint - Verify end-to-end flow
  - Run full sync with customer and invoice sync
  - Verify reminders are created only for customers with phones
  - Verify no reminders for customers without phones
  - Check database for data consistency
  - Ask user if ready to proceed with cleanup

- [x] 15. Add foreign key constraint and cleanup old columns
  - [x] 15.1 Update schema to add FK constraint
    - Add foreign key constraint from `invoicesCache.customerId` to `customers_cache.id`
    - Mark old columns for deprecation: `customerName`, `customerPhone`, `customerCountryCode`, `customerTimezone`
    - Generate migration
    - _Requirements: FR-3, TR-3, TR-4_

  - [x] 15.2 Run migration and verify
    - Apply migration to database
    - Verify FK constraint is working
    - Test cascade behavior if needed
    - _Requirements: TR-3_

- [ ]* 16. Performance optimization and monitoring
  - [ ]* 16.1 Add batch processing for customer inserts
    - Implement batch inserts (100 customers at a time)
    - Use database transactions for consistency
    - _Requirements: TR-4_

  - [ ]* 16.2 Add rate limiting for Zoho API
    - Implement rate limiter respecting 100 req/min limit
    - Add exponential backoff for rate limit errors
    - _Requirements: TR-5_

  - [ ]* 16.3 Add monitoring and logging
    - Log customer sync metrics (fetched, inserted, updated)
    - Log API call counts and timing
    - Add error tracking for customer sync failures
    - _Requirements: FR-7_

- [x] 17. Final checkpoint - Production readiness
  - Run complete sync multiple times to verify stability
  - Check logs for any errors or warnings
  - Verify API call reduction (should be 80%+ reduction)
  - Verify no data loss during migration
  - Document any known issues or limitations
  - Ask user for final approval before marking complete

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- The phased approach ensures backward compatibility during migration
- Customer sync runs before invoice sync to ensure customer data is available
- Old customer fields in invoices_cache are kept temporarily for backward compatibility
- Foreign key constraints are added last to ensure data integrity
- Performance optimizations are optional but recommended for production use

