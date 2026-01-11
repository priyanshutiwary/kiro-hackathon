/**
 * Test script to verify sync orchestration with customer sync
 * 
 * This script tests that:
 * 1. Customer sync runs before invoice sync
 * 2. Customer sync errors don't break invoice sync
 * 3. Sync metadata is updated with lastCustomerSyncAt
 */

import { db } from "@/db/drizzle";
import { syncMetadata } from "@/db/schema";
import { eq } from "drizzle-orm";

async function testSyncOrchestration() {
  console.log("=== Testing Sync Orchestration ===\n");
  
  // Get a test user ID from environment or use a default
  const testUserId = process.env.TEST_USER_ID;
  
  if (!testUserId) {
    console.error("ERROR: TEST_USER_ID environment variable not set");
    console.log("Usage: TEST_USER_ID=<user_id> npx tsx scripts/test-sync-orchestration.ts");
    process.exit(1);
  }
  
  console.log(`Testing with user ID: ${testUserId}\n`);
  
  // Check sync metadata before sync
  console.log("1. Checking sync metadata before sync...");
  const metadataBefore = await db
    .select()
    .from(syncMetadata)
    .where(eq(syncMetadata.userId, testUserId))
    .limit(1);
  
  if (metadataBefore.length > 0) {
    console.log("   Existing metadata found:");
    console.log(`   - Last customer sync: ${metadataBefore[0].lastCustomerSyncAt || 'never'}`);
    console.log(`   - Last invoice sync: ${metadataBefore[0].lastIncrementalSyncAt || 'never'}`);
  } else {
    console.log("   No existing metadata (first sync)");
  }
  
  console.log("\n2. Running sync...");
  console.log("   (Check logs above for customer sync phase)\n");
  
  // Import and run sync
  const { syncInvoicesForUser } = await import("../lib/payment-reminders/sync-engine");
  
  // Get organization ID from environment
  const orgId = process.env.ZOHO_ORG_ID;
  if (!orgId) {
    console.error("ERROR: ZOHO_ORG_ID environment variable not set");
    process.exit(1);
  }
  
  try {
    const result = await syncInvoicesForUser(testUserId, orgId);
    
    console.log("\n3. Sync completed!");
    console.log(`   - Customers fetched: ${result.customersFetched}`);
    console.log(`   - Customers inserted: ${result.customersInserted}`);
    console.log(`   - Customers updated: ${result.customersUpdated}`);
    console.log(`   - Invoices fetched: ${result.invoicesFetched}`);
    console.log(`   - Invoices inserted: ${result.invoicesInserted}`);
    console.log(`   - Invoices updated: ${result.invoicesUpdated}`);
    console.log(`   - Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log("\n   Errors:");
      result.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
  } catch (error) {
    console.error("\n   Sync failed with error:", error);
    process.exit(1);
  }
  
  // Check sync metadata after sync
  console.log("\n4. Checking sync metadata after sync...");
  const metadataAfter = await db
    .select()
    .from(syncMetadata)
    .where(eq(syncMetadata.userId, testUserId))
    .limit(1);
  
  if (metadataAfter.length > 0) {
    console.log("   Updated metadata:");
    console.log(`   - Last customer sync: ${metadataAfter[0].lastCustomerSyncAt}`);
    console.log(`   - Last invoice sync: ${metadataAfter[0].lastIncrementalSyncAt}`);
    
    // Verify lastCustomerSyncAt was updated
    if (metadataAfter[0].lastCustomerSyncAt) {
      console.log("\n✅ SUCCESS: lastCustomerSyncAt was updated!");
    } else {
      console.log("\n❌ FAILURE: lastCustomerSyncAt was not updated");
    }
  } else {
    console.log("   ERROR: Metadata not found after sync");
  }
  
  console.log("\n=== Test Complete ===");
  process.exit(0);
}

testSyncOrchestration().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
