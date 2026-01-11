/**
 * Checkpoint 11: Verify invoice sync with customer references
 * 
 * This script verifies:
 * 1. Invoices have customerId populated
 * 2. Missing customers are handled gracefully
 * 3. Customer references are correct
 */

import { db } from "@/db/drizzle";
import { invoicesCache, customersCache, syncMetadata } from "@/db/schema";
import { eq, isNull, isNotNull, sql } from "drizzle-orm";

async function verifyInvoiceCustomerRefs() {
  console.log("=== Checkpoint 11: Verify Invoice-Customer References ===\n");
  
  const testUserId = process.env.TEST_USER_ID;
  
  if (!testUserId) {
    console.error("ERROR: TEST_USER_ID environment variable not set");
    console.log("Usage: TEST_USER_ID=<user_id> npx tsx scripts/verify-invoice-customer-refs.ts");
    process.exit(1);
  }
  
  console.log(`Verifying for user ID: ${testUserId}\n`);
  
  // Step 1: Run full sync
  console.log("STEP 1: Running full sync (customers + invoices)...");
  console.log("─────────────────────────────────────────────────────\n");
  
  const { syncInvoicesForUser } = await import("../lib/payment-reminders/sync-engine");
  const orgId = process.env.ZOHO_ORG_ID;
  
  if (!orgId) {
    console.error("ERROR: ZOHO_ORG_ID environment variable not set");
    process.exit(1);
  }
  
  try {
    const result = await syncInvoicesForUser(testUserId, orgId);
    
    console.log("Sync Results:");
    console.log(`  ✓ Customers fetched: ${result.customersFetched}`);
    console.log(`  ✓ Customers inserted: ${result.customersInserted}`);
    console.log(`  ✓ Customers updated: ${result.customersUpdated}`);
    console.log(`  ✓ Invoices fetched: ${result.invoicesFetched}`);
    console.log(`  ✓ Invoices inserted: ${result.invoicesInserted}`);
    console.log(`  ✓ Invoices updated: ${result.invoicesUpdated}`);
    
    if (result.errors.length > 0) {
      console.log(`  ⚠ Errors: ${result.errors.length}`);
      result.errors.forEach((error, i) => {
        console.log(`    ${i + 1}. ${error}`);
      });
    }
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  }
  
  // Step 2: Verify invoices have customerId populated
  console.log("\n\nSTEP 2: Verifying invoices have customerId populated...");
  console.log("─────────────────────────────────────────────────────\n");
  
  const totalInvoices = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesCache)
    .where(eq(invoicesCache.userId, testUserId));
  
  const invoicesWithCustomerId = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesCache)
    .where(
      sql`${invoicesCache.userId} = ${testUserId} AND ${invoicesCache.customerId} IS NOT NULL`
    );
  
  const invoicesWithoutCustomerId = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesCache)
    .where(
      sql`${invoicesCache.userId} = ${testUserId} AND ${invoicesCache.customerId} IS NULL`
    );
  
  const total = Number(totalInvoices[0]?.count || 0);
  const withCustomer = Number(invoicesWithCustomerId[0]?.count || 0);
  const withoutCustomer = Number(invoicesWithoutCustomerId[0]?.count || 0);
  
  console.log(`Total invoices: ${total}`);
  console.log(`Invoices with customerId: ${withCustomer} (${total > 0 ? ((withCustomer / total) * 100).toFixed(1) : 0}%)`);
  console.log(`Invoices without customerId: ${withoutCustomer} (${total > 0 ? ((withoutCustomer / total) * 100).toFixed(1) : 0}%)`);
  
  if (withCustomer > 0) {
    console.log("\n✅ SUCCESS: Some invoices have customerId populated");
  } else if (total > 0) {
    console.log("\n⚠ WARNING: No invoices have customerId populated");
  }
  
  // Step 3: Verify customer references are valid
  console.log("\n\nSTEP 3: Verifying customer references are valid...");
  console.log("─────────────────────────────────────────────────────\n");
  
  // Check for invoices with customerId that reference existing customers
  const validReferences = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesCache)
    .innerJoin(
      customersCache,
      eq(invoicesCache.customerId, customersCache.id)
    )
    .where(eq(invoicesCache.userId, testUserId));
  
  const validRefs = Number(validReferences[0]?.count || 0);
  
  console.log(`Valid customer references: ${validRefs}`);
  
  if (withCustomer > 0 && validRefs === withCustomer) {
    console.log("✅ SUCCESS: All customerId references are valid");
  } else if (withCustomer > validRefs) {
    console.log(`⚠ WARNING: ${withCustomer - validRefs} invoices have invalid customerId references`);
  }
  
  // Step 4: Sample invoices with customer data
  console.log("\n\nSTEP 4: Sample invoices with customer data...");
  console.log("─────────────────────────────────────────────────────\n");
  
  const sampleInvoices = await db
    .select()
    .from(invoicesCache)
    .where(eq(invoicesCache.userId, testUserId))
    .limit(5);
  
  if (sampleInvoices.length > 0) {
    console.log("Sample invoices (first 5):\n");
    
    for (let i = 0; i < sampleInvoices.length; i++) {
      const inv = sampleInvoices[i];
      console.log(`${i + 1}. Invoice: ${inv.invoiceNumber}`);
      console.log(`   Customer Name (invoice): ${inv.customerName}`);
      console.log(`   Zoho Customer ID: ${inv.zohoCustomerId}`);
      console.log(`   Customer ID (FK): ${inv.customerId || 'NULL'}`);
      
      // If customerId exists, fetch customer data
      if (inv.customerId) {
        const customer = await db
          .select()
          .from(customersCache)
          .where(eq(customersCache.id, inv.customerId))
          .limit(1);
        
        if (customer.length > 0) {
          console.log(`   Customer Name (cache): ${customer[0].customerName}`);
          console.log(`   Customer Phone (cache): ${customer[0].primaryPhone || 'N/A'}`);
        }
      } else {
        console.log(`   Customer Name (cache): N/A`);
        console.log(`   Customer Phone (cache): N/A`);
      }
      console.log();
    }
  } else {
    console.log("No invoices found for this user");
  }
  
  // Step 5: Check for missing customers
  console.log("\nSTEP 5: Checking for missing customer scenarios...");
  console.log("─────────────────────────────────────────────────────\n");
  
  // Invoices with zohoCustomerId but no customerId
  const missingCustomerLinks = await db
    .select({
      invoiceNumber: invoicesCache.invoiceNumber,
      zohoCustomerId: invoicesCache.zohoCustomerId,
    })
    .from(invoicesCache)
    .where(
      sql`${invoicesCache.userId} = ${testUserId} 
          AND ${invoicesCache.zohoCustomerId} IS NOT NULL 
          AND ${invoicesCache.customerId} IS NULL`
    )
    .limit(10);
  
  if (missingCustomerLinks.length > 0) {
    console.log(`⚠ Found ${missingCustomerLinks.length} invoices with zohoCustomerId but no customerId:`);
    missingCustomerLinks.forEach((inv, i) => {
      console.log(`  ${i + 1}. Invoice ${inv.invoiceNumber} - Zoho Customer ID: ${inv.zohoCustomerId}`);
    });
    console.log("\nThis is expected if:");
    console.log("  - Customer sync hasn't run yet for these customers");
    console.log("  - Customers were deleted in Zoho");
    console.log("  - There's a mismatch in customer IDs");
  } else {
    console.log("✅ No missing customer links found");
  }
  
  // Step 6: Summary
  console.log("\n\n═══════════════════════════════════════════════════");
  console.log("CHECKPOINT SUMMARY");
  console.log("═══════════════════════════════════════════════════\n");
  
  const checks = [];
  
  if (withCustomer > 0) {
    checks.push("✅ Invoices have customerId populated");
  } else if (total > 0) {
    checks.push("⚠ No invoices have customerId populated");
  } else {
    checks.push("ℹ No invoices found for this user");
  }
  
  if (validRefs === withCustomer && withCustomer > 0) {
    checks.push("✅ All customer references are valid");
  } else if (withCustomer > validRefs) {
    checks.push("⚠ Some customer references are invalid");
  }
  
  if (missingCustomerLinks.length === 0) {
    checks.push("✅ No missing customer links");
  } else {
    checks.push(`⚠ ${missingCustomerLinks.length} invoices missing customer links`);
  }
  
  checks.forEach(check => console.log(check));
  
  console.log("\n═══════════════════════════════════════════════════\n");
  
  process.exit(0);
}

verifyInvoiceCustomerRefs().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});
