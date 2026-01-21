/**
 * Sync Engine Core Functions
 * 
 * Handles invoice synchronization, change detection, and reminder management.
 * Requirements: 3.1-3.8, 4.1-4.8, 5.1-5.5, 6.1-6.6, 10.1-10.5
 */

import { db } from "@/db/drizzle";
import { invoicesCache, paymentReminders, syncMetadata, customersCache } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ZohoInvoice, ZohoBooksClient, createZohoBooksClient } from "./zoho-books-client";
import { calculateInvoiceHash, detectChanges, InvoiceChanges } from "./invoice-hash";
import { buildReminderSchedule, ReminderScheduleItem } from "./reminder-schedule";
import { ReminderSettings, getUserSettings } from "./settings-manager";
import { getMaxReminderDays } from "./reminder-schedule";
import { syncCustomersForUser} from "./customer-sync-engine";

/**
 * Process and upsert invoice into cache
 * 
 * This function:
 * 1. Calculates invoice hash for change detection
 * 2. Checks if invoice exists in cache
 * 3. Inserts new invoices or updates existing ones
 * 4. Handles change detection and triggers appropriate actions
 * 
 * Requirements: 3.1, 3.8, 4.1, 4.2, 5.1, 5.2, 5.4
 * 
 * @param userId - User ID who owns the invoice
 * @param zohoInvoice - Invoice data from Zoho Books
 * @param settings - User reminder settings
 * @returns Promise that resolves when processing is complete
 */
export async function processAndUpsertInvoice(
  userId: string,
  zohoInvoice: ZohoInvoice,
  settings: ReminderSettings
): Promise<void> {
  console.log(`[Sync Engine] Processing invoice ${zohoInvoice.invoice_id} (${zohoInvoice.invoice_number})`);
  
  // Calculate hash for change detection (Requirement 4.1)
  const syncHash = calculateInvoiceHash(zohoInvoice);
  
  // Look up customerId from customers_cache using zohoCustomerId (Requirement FR-3, FR-4)
  let customerId: string | null = null;
  if (zohoInvoice.customer_id) {
    const customers = await db
      .select({ id: customersCache.id })
      .from(customersCache)
      .where(
        and(
          eq(customersCache.userId, userId),
          eq(customersCache.zohoCustomerId, zohoInvoice.customer_id)
        )
      )
      .limit(1);
    
    if (customers.length > 0) {
      customerId = customers[0].id;
      console.log(`[Sync Engine] Found customer ${customerId} for Zoho customer ${zohoInvoice.customer_id}`);
    } else {
      // Customer not found - log warning and set customerId to null (Requirement FR-7)
      console.warn(`[Sync Engine] Customer not found in cache for Zoho customer ${zohoInvoice.customer_id} (invoice ${zohoInvoice.invoice_id})`);
    }
  }
  
  // Check if invoice exists in cache (Requirement 5.1, 5.2)
  const existingInvoices = await db
    .select()
    .from(invoicesCache)
    .where(
      and(
        eq(invoicesCache.userId, userId),
        eq(invoicesCache.zohoInvoiceId, zohoInvoice.invoice_id)
      )
    )
    .limit(1);
  
  const now = new Date();
  const dueDate = new Date(zohoInvoice.due_date);
  
  if (existingInvoices.length === 0) {
    // Insert new invoice (Requirement 5.2)
    console.log(`[Sync Engine] New invoice detected: ${zohoInvoice.invoice_id}, inserting into cache`);
    const newInvoiceId = crypto.randomUUID();
    
    await db.insert(invoicesCache).values({
      id: newInvoiceId,
      userId,
      zohoInvoiceId: zohoInvoice.invoice_id,
      customerId, // Store customerId reference (Requirement FR-3)
      customerName: zohoInvoice.customer_name, // Keep for backward compatibility during migration
      customerPhone: zohoInvoice.customer_phone || null, // Keep for backward compatibility during migration
      customerCountryCode: null, // Not provided by Zoho API
      customerTimezone: null, // Not provided by Zoho API
      invoiceNumber: zohoInvoice.invoice_number,
      amountTotal: zohoInvoice.total.toString(),
      amountDue: zohoInvoice.balance.toString(),
      currencyCode: zohoInvoice.currency_code || 'USD', // Store currency code
      dueDate,
      status: zohoInvoice.status,
      zohoLastModifiedAt: new Date(zohoInvoice.last_modified_time),
      localLastSyncedAt: now,
      syncHash,
      remindersCreated: false,
      createdAt: now,
      updatedAt: now,
    });
    
    // Create reminders for new invoice (Requirement 6.1)
    console.log(`[Sync Engine] Creating reminders for new invoice ${newInvoiceId}`);
    await createRemindersForInvoice(newInvoiceId, userId, dueDate, settings);
  } else {
    // Invoice exists - check for changes (Requirement 4.2)
    const existingInvoice = existingInvoices[0];
    
    // Check if hash has changed
    if (existingInvoice.syncHash !== syncHash) {
      console.log(`[Sync Engine] Invoice ${zohoInvoice.invoice_id} has changes, updating cache`);
      // Detect specific changes (Requirement 4.2)
      const changes = detectChanges(
        {
          invoiceNumber: existingInvoice.invoiceNumber || '',
          amountTotal: existingInvoice.amountTotal || '0',
          amountDue: existingInvoice.amountDue || '0',
          dueDate: existingInvoice.dueDate,
          status: existingInvoice.status || '',
          customerPhone: existingInvoice.customerPhone || '',
          syncHash: existingInvoice.syncHash || '',
        },
        zohoInvoice
      );
      
      // Update invoice in cache (Requirement 5.1)
      await db
        .update(invoicesCache)
        .set({
          customerId, // Update customerId reference (Requirement FR-3)
          customerName: zohoInvoice.customer_name, // Keep for backward compatibility during migration
          customerPhone: zohoInvoice.customer_phone || null, // Keep for backward compatibility during migration
          invoiceNumber: zohoInvoice.invoice_number,
          amountTotal: zohoInvoice.total.toString(),
          amountDue: zohoInvoice.balance.toString(),
          currencyCode: zohoInvoice.currency_code || 'USD', // Update currency code
          dueDate,
          status: zohoInvoice.status,
          zohoLastModifiedAt: new Date(zohoInvoice.last_modified_time),
          localLastSyncedAt: now,
          syncHash,
          updatedAt: now,
        })
        .where(eq(invoicesCache.id, existingInvoice.id));
      
      // Handle changes (Requirement 4.3, 4.4, 4.5, 4.6)
      await handleInvoiceChanges(existingInvoice.id, changes, dueDate, userId, settings);
    } else {
      // No changes - just update sync timestamp (Requirement 5.4)
      console.log(`[Sync Engine] Invoice ${zohoInvoice.invoice_id} unchanged, updating sync timestamp only`);
      await db
        .update(invoicesCache)
        .set({
          localLastSyncedAt: now,
          updatedAt: now,
        })
        .where(eq(invoicesCache.id, existingInvoice.id));
    }
  }
}

/**
 * Handle invoice changes detected during sync
 * 
 * This function processes different types of invoice changes:
 * - Status changes: Cancel reminders if invoice is paid
 * - Due date changes: Recreate reminders with new dates
 * - Amount changes: Update cached amounts (already done in processAndUpsertInvoice)
 * - Phone changes: Update cached phone (already done in processAndUpsertInvoice)
 * 
 * Requirements: 4.3, 4.4, 4.5, 4.6
 * 
 * @param invoiceId - Database ID of the invoice
 * @param changes - Detected changes
 * @param newDueDate - New due date (if changed)
 * @param userId - User ID who owns the invoice
 * @param settings - User reminder settings
 * @returns Promise that resolves when changes are handled
 */
export async function handleInvoiceChanges(
  invoiceId: string,
  changes: InvoiceChanges,
  newDueDate: Date,
  userId: string,
  settings: ReminderSettings
): Promise<void> {
  console.log(`[Sync Engine] Handling changes for invoice ${invoiceId}:`, {
    statusChanged: changes.statusChanged,
    dueDateChanged: changes.dueDateChanged,
    amountChanged: changes.amountChanged,
    phoneChanged: changes.phoneChanged,
  });
  
  // Handle status change to paid (Requirement 4.3)
  if (changes.statusChanged) {
    // Get the updated invoice to check if it's paid
    const invoice = await db
      .select()
      .from(invoicesCache)
      .where(eq(invoicesCache.id, invoiceId))
      .limit(1);
    
    if (invoice.length > 0 && invoice[0].status === 'paid') {
      // Cancel all pending reminders for paid invoice
      console.log(`[Sync Engine] Invoice ${invoiceId} marked as paid, cancelling pending reminders`);
      await db
        .update(paymentReminders)
        .set({
          status: 'skipped',
          skipReason: 'Invoice marked as paid',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(paymentReminders.invoiceId, invoiceId),
            eq(paymentReminders.status, 'pending')
          )
        );
    }
  }
  
  // Handle due date change (Requirement 4.4)
  if (changes.dueDateChanged) {
    console.log(`[Sync Engine] Due date changed for invoice ${invoiceId}, recreating reminders`);
    // Delete all existing pending reminders
    await db
      .delete(paymentReminders)
      .where(
        and(
          eq(paymentReminders.invoiceId, invoiceId),
          eq(paymentReminders.status, 'pending')
        )
      );
    
    // Reset reminders_created flag
    await db
      .update(invoicesCache)
      .set({
        remindersCreated: false,
        updatedAt: new Date(),
      })
      .where(eq(invoicesCache.id, invoiceId));
    
    // Create new reminders with updated due date
    await createRemindersForInvoice(invoiceId, userId, newDueDate, settings);
  }
  
  // Amount and phone changes are already handled in processAndUpsertInvoice
  // (Requirements 4.5, 4.6)
}

/**
 * Create reminders for an invoice based on user settings
 * 
 * This function:
 * 1. Joins with customers_cache to get customer data
 * 2. Checks if customer has a phone number (required for calls)
 * 3. Builds reminder schedule based on user settings
 * 4. Filters to only future reminders (today or later)
 * 5. Inserts reminder records into database
 * 6. Marks invoice as reminders_created
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, FR-5, FR-7
 * 
 * @param invoiceId - Database ID of the invoice
 * @param userId - User ID who owns the invoice
 * @param dueDate - Invoice due date
 * @param settings - User reminder settings
 * @returns Promise that resolves when reminders are created
 */
export async function createRemindersForInvoice(
  invoiceId: string,
  userId: string,
  dueDate: Date,
  settings: ReminderSettings
): Promise<void> {
  console.log(`[Sync Engine] Creating reminders for invoice ${invoiceId}, due date: ${dueDate.toISOString()}`);
  
  // Join with customers_cache to get customer data (Requirement FR-5)
  const result = await db
    .select({
      invoiceNumber: invoicesCache.invoiceNumber,
      customerId: invoicesCache.customerId,
      customerName: customersCache.customerName,
      primaryPhone: customersCache.primaryPhone,
    })
    .from(invoicesCache)
    .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
    .where(eq(invoicesCache.id, invoiceId))
    .limit(1);
  
  if (result.length === 0) {
    console.error(`[Sync Engine] Invoice ${invoiceId} not found when creating reminders`);
    return;
  }
  
  const invoiceData = result[0];
  
  // Skip reminder creation if customer not found (Requirement FR-7)
  if (!invoiceData.customerId) {
    console.log(`[Sync Engine] Skipping reminder creation for invoice ${invoiceId} (${invoiceData.invoiceNumber}): customer not found in cache`);
    // Still mark as processed to avoid repeated attempts
    await db
      .update(invoicesCache)
      .set({
        remindersCreated: true,
        updatedAt: new Date(),
      })
      .where(eq(invoicesCache.id, invoiceId));
    return;
  }
  
  // Skip reminder creation if customer has no phone (Requirement FR-5, FR-7)
  if (!invoiceData.primaryPhone) {
    console.log(`[Sync Engine] Skipping reminder creation for invoice ${invoiceId} (${invoiceData.invoiceNumber}): customer ${invoiceData.customerName} has no phone number`);
    // Still mark as processed to avoid repeated attempts
    await db
      .update(invoicesCache)
      .set({
        remindersCreated: true,
        updatedAt: new Date(),
      })
      .where(eq(invoicesCache.id, invoiceId));
    return;
  }
  
  // Build reminder schedule (Requirement 6.1)
  const schedule = buildReminderSchedule(dueDate, settings);
  
  console.log(`[Sync Engine] Generated ${schedule.length} future reminders for invoice ${invoiceId}`);
  
  // Filter to only future reminders (Requirement 6.2, 6.3)
  // buildReminderSchedule already filters to future dates
  
  if (schedule.length === 0) {
    // No future reminders to create, but still mark as processed
    console.log(`[Sync Engine] No future reminders to create for invoice ${invoiceId}, marking as processed`);
    await db
      .update(invoicesCache)
      .set({
        remindersCreated: true,
        updatedAt: new Date(),
      })
      .where(eq(invoicesCache.id, invoiceId));
    return;
  }
  
  // Insert reminder records (Requirement 6.4, 6.6)
  const now = new Date();
  const reminderRecords = schedule.map((item: ReminderScheduleItem) => ({
    id: crypto.randomUUID(),
    invoiceId,
    userId,
    reminderType: item.reminderType,
    scheduledDate: item.scheduledDate,
    status: 'pending',
    attemptCount: 0,
    lastAttemptAt: null,
    callOutcome: null,
    skipReason: null,
    createdAt: now,
    updatedAt: now,
  }));
  
  // Insert all reminders in a single operation (Requirement 6.6)
  if (reminderRecords.length > 0) {
    console.log(`[Sync Engine] Inserting ${reminderRecords.length} reminder records for invoice ${invoiceId} (customer: ${invoiceData.customerName}, phone: ${invoiceData.primaryPhone})`);
    await db.insert(paymentReminders).values(reminderRecords);
  }
  
  // Mark invoice as reminders_created (Requirement 6.5)
  await db
    .update(invoicesCache)
    .set({
      remindersCreated: true,
      updatedAt: new Date(),
    })
    .where(eq(invoicesCache.id, invoiceId));
}

/**
 * Clean up invoices that are outside the sync window
 * 
 * This function:
 * 1. Finds invoices outside the sync window
 * 2. Deletes associated reminders (cascade delete handles this)
 * 3. Deletes invoices from cache
 * 
 * Exceptions:
 * - Overdue invoices are never removed
 * - Paid invoices are kept for historical tracking
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 * 
 * @param userId - User ID
 * @param windowStart - Start of sync window (earliest due date to keep)
 * @param windowEnd - End of sync window (latest due date to keep)
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupInvoicesOutsideWindow(
  userId: string,
  windowStart: Date,
  windowEnd: Date
): Promise<void> {
  console.log(`[Sync Engine] Starting cleanup for user ${userId}, window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);
  
  const now = new Date();
  
  // Find invoices outside the sync window (Requirement 10.1)
  // Exclude overdue invoices (due date < today) (Requirement 10.3)
  // Exclude paid invoices for historical tracking (Requirement 10.4)
  
  // Get all invoices for the user
  const allInvoices = await db
    .select()
    .from(invoicesCache)
    .where(eq(invoicesCache.userId, userId));
  
  // Filter invoices that should be deleted
  const invoicesToDelete = allInvoices.filter(invoice => {
    const dueDate = new Date(invoice.dueDate);
    
    // Keep overdue invoices (Requirement 10.3)
    if (dueDate < now) {
      return false;
    }
    
    // Keep paid invoices for historical tracking (Requirement 10.4)
    if (invoice.status === 'paid') {
      return false;
    }
    
    // Delete if outside window (before windowStart or after windowEnd)
    return dueDate < windowStart || dueDate > windowEnd;
  });
  
  console.log(`[Sync Engine] Found ${invoicesToDelete.length} invoices to delete (outside window, not overdue, not paid)`);
  
  // Delete invoices (cascade delete will handle reminders) (Requirement 10.2, 10.5)
  for (const invoice of invoicesToDelete) {
    console.log(`[Sync Engine] Deleting invoice ${invoice.id} (${invoice.invoiceNumber})`);
    await db
      .delete(invoicesCache)
      .where(eq(invoicesCache.id, invoice.id));
  }
  
  console.log(`[Sync Engine] Cleanup complete: ${invoicesToDelete.length} invoices deleted`);
}

/**
 * Sync result interface
 */
export interface SyncResult {
  invoicesFetched: number;
  invoicesInserted: number;
  invoicesUpdated: number;
  remindersCreated: number;
  customersFetched: number;
  customersInserted: number;
  customersUpdated: number;
  errors: string[];
}

/**
 * Main sync function for a user
 * 
 * This function orchestrates the complete invoice synchronization process:
 * 1. Gets user settings and sync metadata
 * 2. Calculates sync window based on reminder settings
 * 3. Fetches invoices from Zoho (incremental sync when possible)
 * 4. Processes and upserts each invoice
 * 5. Cleans up invoices outside the sync window
 * 6. Updates sync metadata
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 * 
 * @param userId - User ID to sync invoices for
 * @param organizationId - Zoho organization ID
 * @param zohoClient - Optional Zoho Books client (for testing)
 * @returns Promise resolving to sync result
 */
export async function syncInvoicesForUser(
  userId: string,
  organizationId: string,
  zohoClient?: ZohoBooksClient
): Promise<SyncResult> {
  const syncStartTime = Date.now();
  console.log(`[Sync Engine] Starting sync for user ${userId}, organization ${organizationId}`);
  
  const result: SyncResult = {
    invoicesFetched: 0,
    invoicesInserted: 0,
    invoicesUpdated: 0,
    remindersCreated: 0,
    customersFetched: 0,
    customersInserted: 0,
    customersUpdated: 0,
    errors: [],
  };

  try {
    // 0. Get sync metadata first to determine incremental sync
    console.log(`[Sync Engine] Fetching sync metadata for user ${userId}`);
    const metadata = await db
      .select()
      .from(syncMetadata)
      .where(eq(syncMetadata.userId, userId))
      .limit(1);
    
    const existingMetadata = metadata.length > 0 ? metadata[0] : null;
    
    // 0a. Customer Sync Phase (Requirement FR-4)
    console.log(`[Sync Engine] ===== PHASE 1: CUSTOMER SYNC =====`);
    try {
      // Determine if this is incremental customer sync
      const lastCustomerSync = existingMetadata?.lastCustomerSyncAt;
      const lastModifiedTime = lastCustomerSync ? lastCustomerSync.toISOString() : undefined;
      
      if (lastModifiedTime) {
        console.log(`[Sync Engine] Running incremental customer sync from: ${lastModifiedTime}`);
      } else {
        console.log(`[Sync Engine] Running full customer sync (first sync)`);
      }
      
      // Sync customers before invoices
      const customerSyncResult = await syncCustomersForUser(userId, lastModifiedTime);
      
      // Update result with customer sync stats
      result.customersFetched = customerSyncResult.customersFetched;
      result.customersInserted = customerSyncResult.customersInserted;
      result.customersUpdated = customerSyncResult.customersUpdated;
      
      // Add customer sync errors to overall errors
      if (customerSyncResult.errors.length > 0) {
        result.errors.push(...customerSyncResult.errors);
        console.warn(`[Sync Engine] Customer sync completed with ${customerSyncResult.errors.length} errors`);
      }
      
      console.log(`[Sync Engine] Customer sync complete: ${customerSyncResult.customersFetched} fetched, ${customerSyncResult.customersInserted} inserted, ${customerSyncResult.customersUpdated} updated`);
      
      // Update lastCustomerSyncAt in metadata
      const customerSyncTime = new Date();
      if (existingMetadata) {
        await db
          .update(syncMetadata)
          .set({
            lastCustomerSyncAt: customerSyncTime,
            updatedAt: customerSyncTime,
          })
          .where(eq(syncMetadata.userId, userId));
      } else {
        // Will be created at the end of sync
        console.log(`[Sync Engine] Sync metadata will be created at end of sync`);
      }
    } catch (error) {
      // Handle customer sync errors gracefully - log but continue with invoice sync (Requirement FR-7)
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Customer sync failed: ${errorMessage}`);
      console.error('[Sync Engine] Customer sync error (continuing with invoice sync):', error);
    }
    
    console.log(`[Sync Engine] ===== PHASE 2: INVOICE SYNC =====`);
    
    // 1. Get user settings (Requirement 3.1)
    console.log(`[Sync Engine] Fetching user settings for user ${userId}`);
    const settings = await getUserSettings(userId);
    console.log(`[Sync Engine] User settings loaded: max reminder days = ${getMaxReminderDays(settings)}`);
    
    // 2. Calculate sync window (Requirements 3.3, 3.4, 3.5)
    const maxReminderDays = getMaxReminderDays(settings);
    const syncWindowDays = maxReminderDays + 5; // Add 5-day buffer
    
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - 1); // Start from yesterday to catch any edge cases
    
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + syncWindowDays);
    
    console.log(`[Sync Engine] Sync window calculated: ${syncWindowDays} days (${windowStart.toISOString()} to ${windowEnd.toISOString()})`);
    
    // 3. Determine if this is incremental or full sync (Requirement 3.8)
    const isIncrementalSync = existingMetadata?.lastIncrementalSyncAt !== null && existingMetadata?.lastIncrementalSyncAt !== undefined;
    const lastModifiedAfter = isIncrementalSync && existingMetadata?.lastIncrementalSyncAt
      ? existingMetadata.lastIncrementalSyncAt
      : undefined;
    
    console.log(`[Sync Engine] Sync type: ${isIncrementalSync ? 'incremental' : 'full'}`);
    if (isIncrementalSync && lastModifiedAfter) {
      console.log(`[Sync Engine] Last sync: ${lastModifiedAfter.toISOString()}`);
    }
    
    // 4. Fetch invoices from Zoho (Requirements 3.2, 3.6, 3.7, 3.8)
    console.log(`[Sync Engine] Fetching invoices from Zoho Books...`);
    const client = zohoClient || createZohoBooksClient();
    
    const invoices = await client.getInvoices(userId, {
      organizationId,
      status: ['sent', 'overdue', 'partially_paid'], // Requirement 3.6 - Zoho uses 'sent' and 'overdue' for unpaid invoices
      dueDateMin: windowStart,
      dueDateMax: windowEnd,
      lastModifiedAfter, // Incremental sync (Requirement 3.8)
    });
    
    result.invoicesFetched = invoices.length;
    console.log(`[Sync Engine] Fetched ${invoices.length} invoices within sync window`);
    
    // Also fetch overdue invoices (Requirement 3.7)
    console.log(`[Sync Engine] Fetching overdue invoices...`);
    const overdueInvoices = await client.getInvoices(userId, {
      organizationId,
      status: ['sent', 'overdue', 'partially_paid'], // Zoho uses 'sent' and 'overdue' for unpaid invoices
      dueDateMax: now, // Overdue = due date in the past
      lastModifiedAfter,
    });
    
    console.log(`[Sync Engine] Fetched ${overdueInvoices.length} overdue invoices`);
    
    // Combine and deduplicate invoices
    const allInvoices = [...invoices];
    const invoiceIds = new Set(invoices.map(inv => inv.invoice_id));
    
    for (const overdueInvoice of overdueInvoices) {
      if (!invoiceIds.has(overdueInvoice.invoice_id)) {
        allInvoices.push(overdueInvoice);
        invoiceIds.add(overdueInvoice.invoice_id);
      }
    }
    
    result.invoicesFetched = allInvoices.length;
    console.log(`[Sync Engine] Total invoices to process: ${allInvoices.length} (after deduplication)`);
    
    // 5. Process and upsert each invoice (Requirement 3.1)
    console.log(`[Sync Engine] Processing invoices...`);
    for (const invoice of allInvoices) {
      try {
        // Track if this is a new invoice
        const existingInvoices = await db
          .select()
          .from(invoicesCache)
          .where(
            and(
              eq(invoicesCache.userId, userId),
              eq(invoicesCache.zohoInvoiceId, invoice.invoice_id)
            )
          )
          .limit(1);
        
        const isNewInvoice = existingInvoices.length === 0;
        
        await processAndUpsertInvoice(userId, invoice, settings);
        
        if (isNewInvoice) {
          result.invoicesInserted++;
        } else {
          result.invoicesUpdated++;
        }
        
        // Count reminders created (approximate - we'd need to track this in processAndUpsertInvoice)
        // For now, we'll just increment for new invoices
        if (isNewInvoice) {
          result.remindersCreated++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to process invoice ${invoice.invoice_id}: ${errorMessage}`);
        console.error(`[Sync Engine] Error processing invoice ${invoice.invoice_id}:`, error);
      }
    }
    
    console.log(`[Sync Engine] Invoice processing complete: ${result.invoicesInserted} inserted, ${result.invoicesUpdated} updated`);
    
    // 6. Cleanup invoices outside window (Requirement 10.1-10.5)
    console.log(`[Sync Engine] Cleaning up invoices outside sync window...`);
    try {
      await cleanupInvoicesOutsideWindow(userId, windowStart, windowEnd);
      console.log(`[Sync Engine] Cleanup complete`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Failed to cleanup invoices: ${errorMessage}`);
      console.error('[Sync Engine] Error cleaning up invoices:', error);
    }
    
    // 7. Update sync metadata
    console.log(`[Sync Engine] Updating sync metadata...`);
    const syncTime = new Date();
    
    if (existingMetadata) {
      await db
        .update(syncMetadata)
        .set({
          lastIncrementalSyncAt: syncTime,
          syncWindowDays,
          updatedAt: syncTime,
        })
        .where(eq(syncMetadata.userId, userId));
    } else {
      await db.insert(syncMetadata).values({
        id: crypto.randomUUID(),
        userId,
        lastFullSyncAt: syncTime,
        lastIncrementalSyncAt: syncTime,
        lastCustomerSyncAt: syncTime,
        syncWindowDays,
        createdAt: syncTime,
        updatedAt: syncTime,
      });
    }
    
    const syncDuration = Date.now() - syncStartTime;
    console.log(`[Sync Engine] Sync completed successfully in ${syncDuration}ms`);
    console.log(`[Sync Engine] Summary: ${result.invoicesFetched} fetched, ${result.invoicesInserted} inserted, ${result.invoicesUpdated} updated, ${result.remindersCreated} reminders created`);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Sync failed: ${errorMessage}`);
    console.error('[Sync Engine] Sync error:', error);
    
    const syncDuration = Date.now() - syncStartTime;
    console.error(`[Sync Engine] Sync failed after ${syncDuration}ms`);
    
    return result;
  }
}
