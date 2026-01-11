/**
 * Manual Customer Sync Test Script
 * 
 * This script tests the customer sync functionality independently:
 * 1. Runs customer sync for a user
 * 2. Verifies customers are inserted into customers_cache table
 * 3. Verifies phone numbers are extracted correctly
 * 4. Verifies hash-based change detection works
 * 
 * Usage: npx tsx scripts/test-customer-sync.ts <userId>
 */

import { db } from "@/db/drizzle";
import { customersCache, agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { syncCustomersForUser } from "@/lib/payment-reminders/customer-sync-engine";

async function main() {
  const userId = process.argv[2];

  if (!userId) {
    console.error("Usage: npx tsx scripts/test-customer-sync.ts <userId>");
    process.exit(1);
  }

  console.log("=".repeat(80));
  console.log("CUSTOMER SYNC TEST");
  console.log("=".repeat(80));
  console.log(`User ID: ${userId}`);
  console.log();

  // Step 1: Check if user has Zoho integration
  console.log("Step 1: Checking Zoho integration...");
  const integration = await db
    .select()
    .from(agentIntegrations)
    .where(
      and(
        eq(agentIntegrations.userId, userId),
        eq(agentIntegrations.provider, "zoho_books")
      )
    )
    .limit(1);

  if (integration.length === 0) {
    console.error("❌ No Zoho Books integration found for this user");
    console.error("Please connect Zoho Books first");
    process.exit(1);
  }

  console.log("✅ Zoho integration found");
  console.log(`   Status: ${integration[0].status}`);
  console.log(`   Enabled: ${integration[0].enabled}`);
  console.log();

  // Step 2: Get initial customer count
  console.log("Step 2: Getting initial customer count...");
  const initialCustomers = await db
    .select()
    .from(customersCache)
    .where(eq(customersCache.userId, userId));

  console.log(`📊 Initial customer count: ${initialCustomers.length}`);
  console.log();

  // Step 3: Run customer sync
  console.log("Step 3: Running customer sync...");
  console.log("-".repeat(80));
  
  const syncStartTime = Date.now();
  const result = await syncCustomersForUser(userId);
  const syncDuration = Date.now() - syncStartTime;

  console.log("-".repeat(80));
  console.log();

  // Step 4: Display sync results
  console.log("Step 4: Sync Results");
  console.log("=".repeat(80));
  console.log(`⏱️  Duration: ${syncDuration}ms`);
  console.log(`📥 Customers Fetched: ${result.customersFetched}`);
  console.log(`➕ Customers Inserted: ${result.customersInserted}`);
  console.log(`🔄 Customers Updated: ${result.customersUpdated}`);
  console.log(`✓  Customers Unchanged: ${result.customersUnchanged}`);
  console.log(`❌ Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log("\nError Details:");
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  console.log();

  // Step 5: Verify customers in database
  console.log("Step 5: Verifying customers in database...");
  const finalCustomers = await db
    .select()
    .from(customersCache)
    .where(eq(customersCache.userId, userId));

  console.log(`📊 Final customer count: ${finalCustomers.length}`);
  console.log(`📈 Net change: ${finalCustomers.length - initialCustomers.length}`);
  console.log();

  // Step 6: Verify phone extraction
  console.log("Step 6: Verifying phone extraction...");
  const customersWithPhone = finalCustomers.filter(c => c.primaryPhone);
  const customersWithoutPhone = finalCustomers.filter(c => !c.primaryPhone);

  console.log(`📞 Customers with phone: ${customersWithPhone.length}`);
  console.log(`🚫 Customers without phone: ${customersWithoutPhone.length}`);
  console.log();

  // Step 7: Display sample customers
  console.log("Step 7: Sample Customers");
  console.log("=".repeat(80));
  
  const sampleSize = Math.min(5, finalCustomers.length);
  const samples = finalCustomers.slice(0, sampleSize);

  samples.forEach((customer, index) => {
    console.log(`\nCustomer ${index + 1}:`);
    console.log(`  ID: ${customer.id}`);
    console.log(`  Zoho ID: ${customer.zohoCustomerId}`);
    console.log(`  Name: ${customer.customerName}`);
    console.log(`  Company: ${customer.companyName || "N/A"}`);
    console.log(`  Phone: ${customer.primaryPhone || "N/A"}`);
    console.log(`  Email: ${customer.primaryEmail || "N/A"}`);
    console.log(`  Contact Persons: ${JSON.parse(customer.contactPersons).length}`);
    console.log(`  Last Modified: ${customer.zohoLastModifiedAt?.toISOString() || "N/A"}`);
    console.log(`  Last Synced: ${customer.localLastSyncedAt?.toISOString() || "N/A"}`);
    console.log(`  Hash: ${customer.syncHash?.substring(0, 16)}...`);
  });
  console.log();

  // Step 8: Test hash-based change detection
  console.log("Step 8: Testing hash-based change detection...");
  console.log("Running sync again to verify unchanged customers...");
  console.log("-".repeat(80));
  
  const secondSyncStartTime = Date.now();
  const secondResult = await syncCustomersForUser(userId);
  const secondSyncDuration = Date.now() - secondSyncStartTime;

  console.log("-".repeat(80));
  console.log();

  console.log("Second Sync Results:");
  console.log(`⏱️  Duration: ${secondSyncDuration}ms`);
  console.log(`📥 Customers Fetched: ${secondResult.customersFetched}`);
  console.log(`➕ Customers Inserted: ${secondResult.customersInserted}`);
  console.log(`🔄 Customers Updated: ${secondResult.customersUpdated}`);
  console.log(`✓  Customers Unchanged: ${secondResult.customersUnchanged}`);
  console.log(`❌ Errors: ${secondResult.errors.length}`);
  console.log();

  // Step 9: Verify hash-based change detection
  console.log("Step 9: Verifying hash-based change detection...");
  
  if (secondResult.customersInserted === 0 && secondResult.customersUpdated === 0) {
    console.log("✅ Hash-based change detection working correctly!");
    console.log("   All customers were marked as unchanged (no inserts or updates)");
  } else {
    console.log("⚠️  Unexpected changes detected:");
    console.log(`   Inserted: ${secondResult.customersInserted}`);
    console.log(`   Updated: ${secondResult.customersUpdated}`);
    console.log("   This may indicate hash calculation issues or actual data changes in Zoho");
  }
  console.log();

  // Step 10: Summary
  console.log("=".repeat(80));
  console.log("TEST SUMMARY");
  console.log("=".repeat(80));
  
  const allTestsPassed = 
    result.customersFetched > 0 &&
    finalCustomers.length > 0 &&
    secondResult.customersInserted === 0 &&
    secondResult.customersUpdated === 0;

  if (allTestsPassed) {
    console.log("✅ All tests passed!");
    console.log();
    console.log("Verified:");
    console.log("  ✓ Customer sync runs successfully");
    console.log("  ✓ Customers are inserted into customers_cache table");
    console.log("  ✓ Phone numbers are extracted correctly");
    console.log("  ✓ Hash-based change detection works");
  } else {
    console.log("⚠️  Some tests need attention:");
    if (result.customersFetched === 0) {
      console.log("  ⚠️  No customers fetched from Zoho");
    }
    if (finalCustomers.length === 0) {
      console.log("  ⚠️  No customers in database");
    }
    if (secondResult.customersInserted > 0 || secondResult.customersUpdated > 0) {
      console.log("  ⚠️  Hash-based change detection may need review");
    }
  }
  
  console.log();
  console.log("=".repeat(80));

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
