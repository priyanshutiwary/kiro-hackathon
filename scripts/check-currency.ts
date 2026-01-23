/**
 * Check Currency Script
 * Verifies that invoices have proper currency codes stored
 */

import { db } from "../db/drizzle";
import { invoicesCache } from "../db/schema";
import { eq } from "drizzle-orm";

async function checkCurrency() {
  console.log("🔍 Checking invoice currency codes...\n");

  try {
    // Fetch all invoices
    const invoices = await db
      .select({
        id: invoicesCache.id,
        invoiceNumber: invoicesCache.invoiceNumber,
        currencyCode: invoicesCache.currencyCode,
        amountTotal: invoicesCache.amountTotal,
        amountDue: invoicesCache.amountDue,
      })
      .from(invoicesCache)
      .limit(20);

    if (invoices.length === 0) {
      console.log("❌ No invoices found in database");
      return;
    }

    console.log(`✅ Found ${invoices.length} invoices\n`);
    console.log("Invoice Details:");
    console.log("─".repeat(80));

    // Group by currency
    const byCurrency: Record<string, number> = {};

    invoices.forEach((invoice) => {
      const currency = invoice.currencyCode || "UNKNOWN";
      byCurrency[currency] = (byCurrency[currency] || 0) + 1;

      console.log(
        `📄 ${invoice.invoiceNumber?.padEnd(15)} | ` +
        `Currency: ${currency.padEnd(5)} | ` +
        `Total: ${invoice.amountTotal?.padEnd(10)} | ` +
        `Due: ${invoice.amountDue}`
      );
    });

    console.log("─".repeat(80));
    console.log("\n📊 Currency Distribution:");
    Object.entries(byCurrency).forEach(([currency, count]) => {
      console.log(`   ${currency}: ${count} invoice(s)`);
    });

    // Check for USD defaults
    const usdCount = byCurrency["USD"] || 0;
    if (usdCount === invoices.length) {
      console.log("\n⚠️  All invoices are using USD - this might be the default value");
      console.log("   Run a sync to fetch actual currency codes from Zoho");
    } else if (usdCount > 0) {
      console.log(`\n✅ Found ${Object.keys(byCurrency).length} different currencies`);
    } else {
      console.log("\n✅ No USD defaults found - currencies are properly synced!");
    }

  } catch (error) {
    console.error("❌ Error checking currency:", error);
    process.exit(1);
  }

  process.exit(0);
}

checkCurrency();
