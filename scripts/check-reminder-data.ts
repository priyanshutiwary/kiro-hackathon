/**
 * Check reminder data to see if invoices have customer phone numbers
 */

import { db } from "@/db/drizzle";
import { paymentReminders, invoicesCache, customersCache } from "@/db/schema";
import { eq } from "drizzle-orm";

async function checkReminderData() {
  console.log("\n=== Checking Reminder Data ===\n");
  
  try {
    // Fetch pending reminders with invoice and customer data
    const reminders = await db
      .select({
        reminderId: paymentReminders.id,
        reminderType: paymentReminders.reminderType,
        status: paymentReminders.status,
        invoiceId: invoicesCache.id,
        invoiceNumber: invoicesCache.invoiceNumber,
        customerId: invoicesCache.customerId,
        customerName: customersCache.customerName,
        customerPhone: customersCache.primaryPhone,
      })
      .from(paymentReminders)
      .leftJoin(invoicesCache, eq(paymentReminders.invoiceId, invoicesCache.id))
      .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
      .where(eq(paymentReminders.status, 'pending'))
      .limit(5);
    
    console.log(`Found ${reminders.length} pending reminder(s):\n`);
    
    reminders.forEach((reminder, index) => {
      console.log(`Reminder ${index + 1}:`);
      console.log(`  ID: ${reminder.reminderId}`);
      console.log(`  Type: ${reminder.reminderType}`);
      console.log(`  Invoice: ${reminder.invoiceNumber || 'N/A'}`);
      console.log(`  Customer: ${reminder.customerName || 'N/A'}`);
      console.log(`  Phone: ${reminder.customerPhone || 'MISSING ❌'}`);
      console.log("");
    });
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkReminderData();
