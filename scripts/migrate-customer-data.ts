/**
 * Data Migration Script: Backfill customerId for existing invoices
 * 
 * This script:
 * 1. Backfills customerId for existing invoices using zohoCustomerId
 * 2. Matches invoices to customers in customers_cache
 * 3. Logs invoices that couldn't be matched
 * 4. Runs in batches to avoid memory issues
 * 
 * Requirements: TR-3
 * 
 * Usage:
 *   # Migrate all users
 *   npx tsx scripts/migrate-customer-data.ts
 * 
 *   # Migrate specific user
 *   TEST_USER_ID=<user_id> npx tsx scripts/migrate-customer-data.ts
 * 
 *   # Dry run (no changes)
 *   DRY_RUN=true npx tsx scripts/migrate-customer-data.ts
 */

import { db } from "@/db/drizzle";
import { invoicesCache, customersCache } from "@/db/schema";
import { eq, isNull, isNotNull, and, sql, not } from "drizzle-orm";

const BATCH_SIZE = 100;
const DRY_RUN = process.env.DRY_RUN === "true";

interface MigrationStats {
  totalInvoices: number;
  invoicesWithCustomerId: number;
  invoicesNeedingMigration: number;
  invoicesMatched: number;
  invoicesUnmatched: number;
  invoicesUpdated: number;
  errors: string[];
}

async function migrateCustomerData() {
  console.log("=== Customer Data Migration Script ===\n");
  
  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }
  
  const testUserId = process.env.TEST_USER_ID;
  
  if (testUserId) {
    console.log(`Migrating for specific user: ${testUserId}\n`);
    await migrateForUser(testUserId);
  } else {
    console.log("Migrating for all users\n");
    await migrateAllUsers();
  }
  
  console.log("\n=== Migration Complete ===");
  process.exit(0);
}

async function migrateAllUsers() {
  // Get all unique user IDs from invoices_cache
  const users = await db
    .selectDistinct({ userId: invoicesCache.userId })
    .from(invoicesCache);
  
  console.log(`Found ${users.length} users with invoices\n`);
  
  const allStats: MigrationStats[] = [];
  
  for (let i = 0; i < users.length; i++) {
    const userId = users[i].userId;
    console.log(`\n[${ i + 1}/${users.length}] Processing user: ${userId}`);
    console.log("─".repeat(60));
    
    const stats = await migrateForUser(userId);
    allStats.push(stats);
  }
  
  // Print summary
  console.log("\n\n" + "═".repeat(60));
  console.log("MIGRATION SUMMARY - ALL USERS");
  console.log("═".repeat(60) + "\n");
  
  const totals = allStats.reduce((acc, stats) => ({
    totalInvoices: acc.totalInvoices + stats.totalInvoices,
    invoicesWithCustomerId: acc.invoicesWithCustomerId + stats.invoicesWithCustomerId,
    invoicesNeedingMigration: acc.invoicesNeedingMigration + stats.invoicesNeedingMigration,
    invoicesMatched: acc.invoicesMatched + stats.invoicesMatched,
    invoicesUnmatched: acc.invoicesUnmatched + stats.invoicesUnmatched,
    invoicesUpdated: acc.invoicesUpdated + stats.invoicesUpdated,
    errors: [...acc.errors, ...stats.errors],
  }), {
    totalInvoices: 0,
    invoicesWithCustomerId: 0,
    invoicesNeedingMigration: 0,
    invoicesMatched: 0,
    invoicesUnmatched: 0,
    invoicesUpdated: 0,
    errors: [] as string[],
  });
  
  console.log(`Total users processed: ${users.length}`);
  console.log(`Total invoices: ${totals.totalInvoices}`);
  console.log(`Invoices already with customerId: ${totals.invoicesWithCustomerId}`);
  console.log(`Invoices needing migration: ${totals.invoicesNeedingMigration}`);
  console.log(`Invoices matched to customers: ${totals.invoicesMatched}`);
  console.log(`Invoices unmatched: ${totals.invoicesUnmatched}`);
  
  if (!DRY_RUN) {
    console.log(`Invoices updated: ${totals.invoicesUpdated}`);
  }
  
  if (totals.errors.length > 0) {
    console.log(`\n⚠ Total errors: ${totals.errors.length}`);
  }
  
  console.log("\n" + "═".repeat(60));
}

async function migrateForUser(userId: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalInvoices: 0,
    invoicesWithCustomerId: 0,
    invoicesNeedingMigration: 0,
    invoicesMatched: 0,
    invoicesUnmatched: 0,
    invoicesUpdated: 0,
    errors: [],
  };
  
  try {
    // Step 1: Get counts
    console.log("\n1. Analyzing invoices...");
    
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoicesCache)
      .where(eq(invoicesCache.userId, userId));
    
    stats.totalInvoices = Number(totalResult[0]?.count || 0);
    
    const withCustomerIdResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoicesCache)
      .where(
        and(
          eq(invoicesCache.userId, userId),
          sql`${invoicesCache.customerId} IS NOT NULL`
        )
      );
    
    stats.invoicesWithCustomerId = Number(withCustomerIdResult[0]?.count || 0);
    stats.invoicesNeedingMigration = stats.totalInvoices - stats.invoicesWithCustomerId;
    
    console.log(`   Total invoices: ${stats.totalInvoices}`);
    console.log(`   Already with customerId: ${stats.invoicesWithCustomerId}`);
    console.log(`   Needing migration: ${stats.invoicesNeedingMigration}`);
    
    if (stats.invoicesNeedingMigration === 0) {
      console.log("\n✅ No invoices need migration for this user");
      return stats;
    }
    
    // Step 2: Process invoices in batches
    console.log("\n2. Processing invoices in batches...");
    
    let offset = 0;
    let batchNumber = 1;
    
    while (true) {
      // Fetch batch of invoices that need migration
      console.log(`   Fetching batch ${batchNumber} at offset ${offset}...`);
      const invoicesBatch = await db
        .select()
        .from(invoicesCache)
        .where(
          and(
            eq(invoicesCache.userId, userId),
            isNull(invoicesCache.customerId)
          )
        )
        .limit(BATCH_SIZE)
        .offset(offset);
      
      if (invoicesBatch.length === 0) {
        break;
      }
      
      console.log(`\n   Batch ${batchNumber} (${invoicesBatch.length} invoices):`);
      
      // Process each invoice in the batch
      for (const invoice of invoicesBatch) {
        try {
          // Skip if zohoCustomerId is null (shouldn't happen due to WHERE clause, but be safe)
          if (!invoice.zohoCustomerId) {
            stats.invoicesUnmatched++;
            const message = `Invoice ${invoice.invoiceNumber} (ID: ${invoice.id}) - Missing Zoho Customer ID`;
            stats.errors.push(message);
            continue;
          }
          
          // Look up customer by userId + zohoCustomerId
          const customers = await db
            .select()
            .from(customersCache)
            .where(
              and(
                eq(customersCache.userId, userId),
                eq(customersCache.zohoCustomerId, invoice.zohoCustomerId)
              )
            )
            .limit(1);
          
          if (customers.length > 0) {
            stats.invoicesMatched++;
            
            // Update invoice with customerId
            if (!DRY_RUN) {
              await db
                .update(invoicesCache)
                .set({
                  customerId: customers[0].id,
                  updatedAt: new Date(),
                })
                .where(eq(invoicesCache.id, invoice.id));
              
              stats.invoicesUpdated++;
            }
          } else {
            stats.invoicesUnmatched++;
            const message = `Invoice ${invoice.invoiceNumber} (ID: ${invoice.id}) - No customer found for Zoho Customer ID: ${invoice.zohoCustomerId}`;
            stats.errors.push(message);
          }
        } catch (error) {
          const message = `Error processing invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : String(error)}`;
          stats.errors.push(message);
          console.error(`   ❌ ${message}`);
        }
      }
      
      console.log(`      Matched: ${stats.invoicesMatched}`);
      console.log(`      Unmatched: ${stats.invoicesUnmatched}`);
      if (!DRY_RUN) {
        console.log(`      Updated: ${stats.invoicesUpdated}`);
      }
      
      offset += BATCH_SIZE;
      batchNumber++;
    }
    
    // Step 3: Summary for this user
    console.log("\n3. Migration summary for this user:");
    console.log(`   ✓ Invoices matched to customers: ${stats.invoicesMatched}`);
    console.log(`   ⚠ Invoices unmatched: ${stats.invoicesUnmatched}`);
    
    if (!DRY_RUN) {
      console.log(`   ✓ Invoices updated: ${stats.invoicesUpdated}`);
    } else {
      console.log(`   ℹ Would update: ${stats.invoicesMatched} invoices (DRY RUN)`);
    }
    
    // Step 4: Log unmatched invoices
    if (stats.invoicesUnmatched > 0) {
      console.log("\n4. Unmatched invoices:");
      const unmatchedErrors = stats.errors.filter(e => e.includes("No customer found"));
      unmatchedErrors.slice(0, 10).forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      
      if (unmatchedErrors.length > 10) {
        console.log(`   ... and ${unmatchedErrors.length - 10} more`);
      }
      
      console.log("\n   Possible reasons:");
      console.log("   - Customer sync hasn't run yet for these customers");
      console.log("   - Customers were deleted in Zoho");
      console.log("   - Mismatch in Zoho customer IDs");
      console.log("\n   Recommendation: Run customer sync first, then re-run this migration");
    }
    
  } catch (error) {
    console.error(`\n❌ Migration failed for user ${userId}:`, error);
    stats.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return stats;
}

// Run migration
migrateCustomerData().catch((error) => {
  console.error("\n❌ Migration script failed:", error);
  process.exit(1);
});
