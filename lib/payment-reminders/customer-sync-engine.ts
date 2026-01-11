/**
 * Customer Sync Engine
 * 
 * Handles customer synchronization from Zoho Contacts API to local cache.
 * Implements hash-based change detection and phone extraction logic.
 * 
 * Requirements: FR-2, FR-6, FR-7
 */

import { db } from "@/db/drizzle";
import { customersCache } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ZohoContactsClient, createZohoContactsClient, ZohoContact } from "./zoho-contacts-client";
import { calculateCustomerHash, detectCustomerChanges } from "./customer-hash";
import { extractPrimaryPhone } from "./phone-extractor";

/**
 * Customer sync result interface
 */
export interface CustomerSyncResult {
  customersFetched: number;
  customersInserted: number;
  customersUpdated: number;
  customersUnchanged: number;
  errors: string[];
}

/**
 * Sync customers for a user from Zoho Contacts API
 * 
 * This function:
 * 1. Fetches customers from Zoho Contacts API with pagination
 * 2. Calculates hash for each customer
 * 3. Checks if customer exists in cache (by userId + zohoCustomerId)
 * 4. Inserts new customers, updates changed customers, touches unchanged customers
 * 5. Extracts and stores primary phone using phone extraction logic
 * 6. Stores all contact_persons in jsonb field
 * 7. Handles errors gracefully (log and continue)
 * 
 * Requirements: FR-2, FR-6, FR-7
 * 
 * @param userId - User ID to sync customers for
 * @param lastModifiedTime - Optional ISO timestamp for incremental sync
 * @param zohoClient - Optional Zoho Contacts client (for testing)
 * @returns Promise resolving to sync result
 */
export async function syncCustomersForUser(
  userId: string,
  lastModifiedTime?: string,
  zohoClient?: ZohoContactsClient
): Promise<CustomerSyncResult> {
  const syncStartTime = Date.now();
  console.log(`[Customer Sync] Starting customer sync for user ${userId}`);
  
  const result: CustomerSyncResult = {
    customersFetched: 0,
    customersInserted: 0,
    customersUpdated: 0,
    customersUnchanged: 0,
    errors: [],
  };

  try {
    // Create Zoho Contacts client
    const client = zohoClient || createZohoContactsClient();
    
    // Fetch customers with pagination (Requirement FR-2)
    let page = 1;
    let hasMorePages = true;
    const perPage = 200; // Zoho max per page
    
    console.log(`[Customer Sync] Starting pagination, per_page=${perPage}`);
    if (lastModifiedTime) {
      console.log(`[Customer Sync] Incremental sync from: ${lastModifiedTime}`);
    }
    
    while (hasMorePages) {
      try {
        console.log(`[Customer Sync] Fetching page ${page}...`);
        
        // Fetch contacts from Zoho (Requirement FR-2)
        const response = await client.getContacts(
          userId,
          page,
          perPage,
          lastModifiedTime
        );
        
        const contacts = response.contacts;
        result.customersFetched += contacts.length;
        
        console.log(`[Customer Sync] Page ${page}: fetched ${contacts.length} contacts`);
        
        // Process each customer
        for (const contact of contacts) {
          try {
            await processAndUpsertCustomer(userId, contact, result);
          } catch (error) {
            // Handle errors gracefully - log and continue (Requirement FR-7)
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push(`Failed to process customer ${contact.contact_id}: ${errorMessage}`);
            console.error(`[Customer Sync] Error processing customer ${contact.contact_id}:`, error);
          }
        }
        
        // Check if there are more pages
        hasMorePages = response.pageContext.hasMorePage;
        page++;
        
        console.log(`[Customer Sync] Page ${page - 1} complete. Has more pages: ${hasMorePages}`);
      } catch (error) {
        // Handle pagination errors - log and break (Requirement FR-7)
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to fetch page ${page}: ${errorMessage}`);
        console.error(`[Customer Sync] Error fetching page ${page}:`, error);
        break; // Stop pagination on error
      }
    }
    
    const syncDuration = Date.now() - syncStartTime;
    console.log(`[Customer Sync] Sync completed in ${syncDuration}ms`);
    console.log(`[Customer Sync] Summary: ${result.customersFetched} fetched, ${result.customersInserted} inserted, ${result.customersUpdated} updated, ${result.customersUnchanged} unchanged`);
    
    if (result.errors.length > 0) {
      console.warn(`[Customer Sync] Completed with ${result.errors.length} errors`);
    }
    
    return result;
  } catch (error) {
    // Handle top-level errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Customer sync failed: ${errorMessage}`);
    console.error('[Customer Sync] Sync error:', error);
    
    const syncDuration = Date.now() - syncStartTime;
    console.error(`[Customer Sync] Sync failed after ${syncDuration}ms`);
    
    return result;
  }
}

/**
 * Process and upsert a single customer into cache
 * 
 * This function:
 * 1. Extracts primary phone and email from contact persons
 * 2. Calculates hash for change detection
 * 3. Checks if customer exists in cache
 * 4. Inserts new customers or updates existing ones
 * 5. Updates sync timestamp for unchanged customers
 * 
 * Requirements: FR-2, FR-6, FR-7
 * 
 * @param userId - User ID who owns the customer
 * @param contact - Contact data from Zoho Contacts API
 * @param result - Sync result object to update counters
 * @returns Promise that resolves when processing is complete
 */
async function processAndUpsertCustomer(
  userId: string,
  contact: ZohoContact,
  result: CustomerSyncResult
): Promise<void> {
  console.log(`[Customer Sync] Processing customer ${contact.contact_id} (${contact.contact_name})`);
  
  // Extract primary phone using phone extraction logic (Requirement FR-6)
  // Pass contact-level phone/mobile fields in addition to contact_persons
  const primaryPhone = extractPrimaryPhone(
    contact.contact_persons,
    contact.mobile,
    contact.phone
  );
  
  // Extract primary email from contact level or primary contact person
  const primaryContact = contact.contact_persons?.find(p => p.is_primary_contact);
  const primaryEmail = contact.email || primaryContact?.email || contact.contact_persons?.[0]?.email || null;
  
  // Find primary contact person ID
  const primaryContactPersonId = primaryContact?.contact_person_id || contact.contact_persons?.[0]?.contact_person_id || null;
  
  // Calculate hash for change detection (Requirement FR-2)
  const syncHash = calculateCustomerHash(contact, primaryPhone, primaryEmail);
  
  // Store all contact persons in jsonb field (Requirement FR-2)
  const contactPersonsJson = JSON.stringify(contact.contact_persons || []);
  
  // Check if customer exists in cache (Requirement FR-2)
  const existingCustomers = await db
    .select()
    .from(customersCache)
    .where(
      and(
        eq(customersCache.userId, userId),
        eq(customersCache.zohoCustomerId, contact.contact_id)
      )
    )
    .limit(1);
  
  const now = new Date();
  const zohoLastModifiedAt = new Date(contact.last_modified_time);
  
  if (existingCustomers.length === 0) {
    // Insert new customer (Requirement FR-2)
    console.log(`[Customer Sync] New customer detected: ${contact.contact_id}, inserting into cache`);
    
    await db.insert(customersCache).values({
      id: crypto.randomUUID(),
      userId,
      zohoCustomerId: contact.contact_id,
      customerName: contact.contact_name,
      companyName: contact.company_name || null,
      primaryContactPersonId,
      primaryPhone,
      primaryEmail,
      contactPersons: contactPersonsJson,
      zohoLastModifiedAt,
      localLastSyncedAt: now,
      syncHash,
      createdAt: now,
      updatedAt: now,
    });
    
    result.customersInserted++;
    
    if (primaryPhone) {
      console.log(`[Customer Sync] Customer ${contact.contact_id} has phone: ${primaryPhone}`);
    } else {
      console.log(`[Customer Sync] Customer ${contact.contact_id} has no phone number`);
    }
  } else {
    // Customer exists - check for changes (Requirement FR-2)
    const existingCustomer = existingCustomers[0];
    
    // Check if hash has changed
    if (existingCustomer.syncHash !== syncHash) {
      console.log(`[Customer Sync] Customer ${contact.contact_id} has changes, updating cache`);
      
      // Detect specific changes for logging
      const changes = detectCustomerChanges(
        {
          customerName: existingCustomer.customerName,
          companyName: existingCustomer.companyName,
          primaryPhone: existingCustomer.primaryPhone,
          primaryEmail: existingCustomer.primaryEmail,
          contactPersons: existingCustomer.contactPersons,
          syncHash: existingCustomer.syncHash || '',
        },
        contact,
        primaryPhone,
        primaryEmail
      );
      
      console.log(`[Customer Sync] Changes detected:`, {
        nameChanged: changes.nameChanged,
        phoneChanged: changes.phoneChanged,
        emailChanged: changes.emailChanged,
        contactPersonsChanged: changes.contactPersonsChanged,
      });
      
      // Update customer in cache (Requirement FR-2)
      await db
        .update(customersCache)
        .set({
          customerName: contact.contact_name,
          companyName: contact.company_name || null,
          primaryContactPersonId,
          primaryPhone,
          primaryEmail,
          contactPersons: contactPersonsJson,
          zohoLastModifiedAt,
          localLastSyncedAt: now,
          syncHash,
          updatedAt: now,
        })
        .where(eq(customersCache.id, existingCustomer.id));
      
      result.customersUpdated++;
    } else {
      // No changes - just update sync timestamp (Requirement FR-2)
      console.log(`[Customer Sync] Customer ${contact.contact_id} unchanged, updating sync timestamp only`);
      
      await db
        .update(customersCache)
        .set({
          localLastSyncedAt: now,
          updatedAt: now,
        })
        .where(eq(customersCache.id, existingCustomer.id));
      
      result.customersUnchanged++;
    }
  }
}
