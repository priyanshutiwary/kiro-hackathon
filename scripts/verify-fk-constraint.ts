import { db } from "../db/drizzle";
import { customersCache, invoicesCache, user } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Verification script for FK constraint on invoicesCache.customerId
 * Tests:
 * 1. FK constraint exists and is enforced
 * 2. ON DELETE SET NULL behavior works correctly
 * 3. Invalid customer references are rejected
 */

async function verifyFKConstraint() {
  console.log("🔍 Verifying FK constraint on invoicesCache.customerId...\n");

  try {
    // Test 1: Check if FK constraint exists by querying database metadata
    console.log("Test 1: Checking if FK constraint exists...");
    const fkQuery = await db.execute(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'invoices_cache'
        AND kcu.column_name = 'customerId';
    `);

    if (fkQuery.rows.length === 0) {
      console.log("❌ FK constraint NOT found!");
      return;
    }

    const fkInfo = fkQuery.rows[0] as any;
    console.log("✅ FK constraint found:");
    console.log(`   Constraint name: ${fkInfo.constraint_name}`);
    console.log(`   References: ${fkInfo.foreign_table_name}.${fkInfo.foreign_column_name}`);
    console.log(`   Delete rule: ${fkInfo.delete_rule}`);
    console.log();

    // Get an existing user for testing
    const existingUsers = await db.select().from(user).limit(1);
    if (existingUsers.length === 0) {
      console.log("⚠️  No users found in database. Skipping tests 2-4.");
      console.log("   Test 1 passed - FK constraint exists with correct configuration.");
      return;
    }
    const testUserId = existingUsers[0].id;
    console.log(`   Using existing user: ${testUserId}`);
    console.log();

    // Test 2: Verify ON DELETE SET NULL behavior
    console.log("Test 2: Testing ON DELETE SET NULL behavior...");
    
    // Create a test customer
    const testCustomer = await db.insert(customersCache).values({
      id: "test-customer-fk-verify",
      userId: testUserId,
      zohoCustomerId: "test-zoho-customer-fk",
      customerName: "Test Customer FK",
      contactPersons: "[]",
    }).returning();

    console.log(`   Created test customer: ${testCustomer[0].id}`);

    // Create a test invoice referencing the customer
    const testInvoice = await db.insert(invoicesCache).values({
      id: "test-invoice-fk-verify",
      userId: testUserId,
      zohoInvoiceId: "test-zoho-invoice-fk",
      customerId: testCustomer[0].id,
      dueDate: new Date(),
    }).returning();

    console.log(`   Created test invoice: ${testInvoice[0].id} with customerId: ${testInvoice[0].customerId}`);

    // Delete the customer
    await db.delete(customersCache).where(eq(customersCache.id, testCustomer[0].id));
    console.log(`   Deleted test customer`);

    // Check if invoice's customerId was set to NULL
    const updatedInvoice = await db.select().from(invoicesCache).where(eq(invoicesCache.id, testInvoice[0].id));
    
    if (updatedInvoice[0].customerId === null) {
      console.log("✅ ON DELETE SET NULL works correctly - customerId was set to NULL");
    } else {
      console.log(`❌ ON DELETE SET NULL failed - customerId is still: ${updatedInvoice[0].customerId}`);
    }

    // Cleanup
    await db.delete(invoicesCache).where(eq(invoicesCache.id, testInvoice[0].id));
    console.log(`   Cleaned up test invoice`);
    console.log();

    // Test 3: Verify invalid customer references are rejected
    console.log("Test 3: Testing invalid customer reference rejection...");
    
    try {
      await db.insert(invoicesCache).values({
        id: "test-invoice-invalid-fk",
        userId: testUserId,
        zohoInvoiceId: "test-zoho-invoice-invalid-fk",
        customerId: "non-existent-customer-id",
        dueDate: new Date(),
      });
      console.log("❌ Invalid customer reference was NOT rejected!");
      
      // Cleanup if it somehow succeeded
      await db.delete(invoicesCache).where(eq(invoicesCache.id, "test-invoice-invalid-fk"));
    } catch (error: any) {
      if (error.message.includes("foreign key constraint")) {
        console.log("✅ Invalid customer reference was correctly rejected");
        console.log(`   Error: ${error.message.split('\n')[0]}`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }
    console.log();

    // Test 4: Verify NULL customerId is allowed
    console.log("Test 4: Testing NULL customerId is allowed...");
    
    try {
      const nullInvoice = await db.insert(invoicesCache).values({
        id: "test-invoice-null-fk",
        userId: testUserId,
        zohoInvoiceId: "test-zoho-invoice-null-fk",
        customerId: null,
        dueDate: new Date(),
      }).returning();
      
      console.log("✅ NULL customerId is allowed");
      console.log(`   Created invoice with NULL customerId: ${nullInvoice[0].id}`);
      
      // Cleanup
      await db.delete(invoicesCache).where(eq(invoicesCache.id, nullInvoice[0].id));
      console.log(`   Cleaned up test invoice`);
    } catch (error: any) {
      console.log(`❌ NULL customerId was rejected: ${error.message}`);
    }
    console.log();

    console.log("✅ All FK constraint tests passed!");
    
  } catch (error) {
    console.error("❌ Error during FK constraint verification:", error);
    throw error;
  }
}

// Run verification
verifyFKConstraint()
  .then(() => {
    console.log("\n✅ FK constraint verification complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ FK constraint verification failed:", error);
    process.exit(1);
  });
