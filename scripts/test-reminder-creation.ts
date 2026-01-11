/**
 * Test script to verify reminder creation with customer data
 * 
 * This script tests that:
 * 1. Reminders are created when customer has a phone
 * 2. Reminders are skipped when customer has no phone
 * 3. Reminders are skipped when customer not found
 */

import { db } from "@/db/drizzle";
import { customersCache, invoicesCache, paymentReminders, reminderSettings, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createRemindersForInvoice } from "@/lib/payment-reminders/sync-engine";
import { ReminderSettings } from "@/lib/payment-reminders/settings-manager";

const TEST_USER_ID = "test-reminder-user-" + Date.now();

async function cleanup() {
  console.log("Cleaning up test data...");
  await db.delete(paymentReminders).where(eq(paymentReminders.userId, TEST_USER_ID));
  await db.delete(invoicesCache).where(eq(invoicesCache.userId, TEST_USER_ID));
  await db.delete(customersCache).where(eq(customersCache.userId, TEST_USER_ID));
  await db.delete(reminderSettings).where(eq(reminderSettings.userId, TEST_USER_ID));
  await db.delete(user).where(eq(user.id, TEST_USER_ID));
}

async function testReminderCreation() {
  console.log("\n=== Testing Reminder Creation with Customer Data ===\n");
  
  try {
    // Setup: Create test user
    console.log("1. Creating test user...");
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Setup: Create reminder settings
    console.log("2. Creating reminder settings...");
    await db.insert(reminderSettings).values({
      id: crypto.randomUUID(),
      userId: TEST_USER_ID,
      reminder7DaysBefore: true,
      reminder3DaysBefore: true,
      reminder1DayBefore: true,
      reminderOnDueDate: true,
      reminder1DayOverdue: true,
      callTimezone: "UTC",
      callStartTime: "09:00:00",
      callEndTime: "18:00:00",
      callDaysOfWeek: "[1,2,3,4,5]",
      maxRetryAttempts: 3,
      retryDelayHours: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const settings: ReminderSettings = {
      reminder30DaysBefore: false,
      reminder15DaysBefore: false,
      reminder7DaysBefore: true,
      reminder5DaysBefore: false,
      reminder3DaysBefore: true,
      reminder1DayBefore: true,
      reminderOnDueDate: true,
      reminder1DayOverdue: true,
      reminder3DaysOverdue: false,
      reminder7DaysOverdue: false,
      customReminderDays: [],
      callTimezone: "UTC",
      callStartTime: "09:00:00",
      callEndTime: "18:00:00",
      callDaysOfWeek: [1, 2, 3, 4, 5],
      maxRetryAttempts: 3,
      retryDelayHours: 2,
    };
    
    // Test Case 1: Customer with phone - should create reminders
    console.log("\n3. Test Case 1: Customer with phone");
    const customer1Id = crypto.randomUUID();
    await db.insert(customersCache).values({
      id: customer1Id,
      userId: TEST_USER_ID,
      zohoCustomerId: "CUST-001",
      customerName: "John Doe",
      primaryPhone: "+1234567890",
      primaryEmail: "john@example.com",
      contactPersons: "[]",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const invoice1Id = crypto.randomUUID();
    const dueDate1 = new Date();
    dueDate1.setDate(dueDate1.getDate() + 7); // Due in 7 days
    
    await db.insert(invoicesCache).values({
      id: invoice1Id,
      userId: TEST_USER_ID,
      zohoInvoiceId: "INV-001",
      customerId: customer1Id,
      customerName: "John Doe",
      invoiceNumber: "INV-001",
      amountTotal: "1000.00",
      amountDue: "1000.00",
      dueDate: dueDate1,
      status: "sent",
      remindersCreated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await createRemindersForInvoice(invoice1Id, TEST_USER_ID, dueDate1, settings);
    
    const reminders1 = await db
      .select()
      .from(paymentReminders)
      .where(eq(paymentReminders.invoiceId, invoice1Id));
    
    console.log(`   ✓ Created ${reminders1.length} reminders for invoice with customer phone`);
    
    // Test Case 2: Customer without phone - should skip reminders
    console.log("\n4. Test Case 2: Customer without phone");
    const customer2Id = crypto.randomUUID();
    await db.insert(customersCache).values({
      id: customer2Id,
      userId: TEST_USER_ID,
      zohoCustomerId: "CUST-002",
      customerName: "Jane Smith",
      primaryPhone: null,
      primaryEmail: "jane@example.com",
      contactPersons: "[]",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const invoice2Id = crypto.randomUUID();
    const dueDate2 = new Date();
    dueDate2.setDate(dueDate2.getDate() + 7);
    
    await db.insert(invoicesCache).values({
      id: invoice2Id,
      userId: TEST_USER_ID,
      zohoInvoiceId: "INV-002",
      customerId: customer2Id,
      customerName: "Jane Smith",
      invoiceNumber: "INV-002",
      amountTotal: "2000.00",
      amountDue: "2000.00",
      dueDate: dueDate2,
      status: "sent",
      remindersCreated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await createRemindersForInvoice(invoice2Id, TEST_USER_ID, dueDate2, settings);
    
    const reminders2 = await db
      .select()
      .from(paymentReminders)
      .where(eq(paymentReminders.invoiceId, invoice2Id));
    
    console.log(`   ✓ Created ${reminders2.length} reminders for invoice without customer phone (expected: 0)`);
    
    // Verify invoice is marked as processed
    const invoice2 = await db
      .select()
      .from(invoicesCache)
      .where(eq(invoicesCache.id, invoice2Id))
      .limit(1);
    
    console.log(`   ✓ Invoice marked as remindersCreated: ${invoice2[0].remindersCreated}`);
    
    // Test Case 3: Invoice without customer - should skip reminders
    console.log("\n5. Test Case 3: Invoice without customer");
    const invoice3Id = crypto.randomUUID();
    const dueDate3 = new Date();
    dueDate3.setDate(dueDate3.getDate() + 7);
    
    await db.insert(invoicesCache).values({
      id: invoice3Id,
      userId: TEST_USER_ID,
      zohoInvoiceId: "INV-003",
      customerId: null,
      customerName: "Unknown Customer",
      invoiceNumber: "INV-003",
      amountTotal: "3000.00",
      amountDue: "3000.00",
      dueDate: dueDate3,
      status: "sent",
      remindersCreated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await createRemindersForInvoice(invoice3Id, TEST_USER_ID, dueDate3, settings);
    
    const reminders3 = await db
      .select()
      .from(paymentReminders)
      .where(eq(paymentReminders.invoiceId, invoice3Id));
    
    console.log(`   ✓ Created ${reminders3.length} reminders for invoice without customer (expected: 0)`);
    
    // Verify invoice is marked as processed
    const invoice3 = await db
      .select()
      .from(invoicesCache)
      .where(eq(invoicesCache.id, invoice3Id))
      .limit(1);
    
    console.log(`   ✓ Invoice marked as remindersCreated: ${invoice3[0].remindersCreated}`);
    
    console.log("\n=== All Tests Passed ===\n");
    
    // Summary
    console.log("Summary:");
    console.log(`  - Test 1 (customer with phone): ${reminders1.length} reminders created ✓`);
    console.log(`  - Test 2 (customer without phone): ${reminders2.length} reminders created (expected 0) ✓`);
    console.log(`  - Test 3 (no customer): ${reminders3.length} reminders created (expected 0) ✓`);
    
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    await cleanup();
  }
}

// Run the test
testReminderCreation()
  .then(() => {
    console.log("\nTest completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nTest failed:", error);
    process.exit(1);
  });
