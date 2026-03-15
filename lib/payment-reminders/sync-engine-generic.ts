import { db } from "@/db/drizzle";
import { syncMetadata, customersCache } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getProvider } from "../providers";
import { processAndUpsertInvoice, cleanupInvoicesOutsideWindow, SyncResult } from "./sync-engine";
import { getUserSettings } from "./settings-manager";
import { getMaxReminderDays } from "./reminder-schedule-builder";
import { ZohoInvoice } from "./zoho-books-client";
import crypto from "crypto";

export async function syncGenericProviderForUser(
    userId: string,
    providerName: string
): Promise<SyncResult> {
    const syncStartTime = Date.now();
    console.log(`[Sync Engine] Starting generic sync for user ${userId}, provider ${providerName}`);

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
        const provider = getProvider(providerName);
        if (!provider) {
            throw new Error(`Provider ${providerName} not found`);
        }

        // 1. Fetch & Upsert Customers
        console.log(`[${providerName}] Fetching customers...`);
        const customers = await provider.getCustomers(userId);
        result.customersFetched = customers.length;

        for (const customer of customers) {
            const existingCustomer = await db
                .select({ id: customersCache.id })
                .from(customersCache)
                .where(
                    and(
                        eq(customersCache.userId, userId),
                        eq(customersCache.zohoCustomerId, customer.externalId)
                    )
                )
                .limit(1);

            if (existingCustomer.length > 0) {
                await db
                    .update(customersCache)
                    .set({
                        customerName: customer.customerName,
                        companyName: customer.companyName || null,
                        primaryPhone: customer.primaryPhone || null,
                        primaryEmail: customer.primaryEmail || null,
                        contactPersons: JSON.stringify(customer.contactPersons || []),
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(customersCache.userId, userId),
                            eq(customersCache.zohoCustomerId, customer.externalId)
                        )
                    );
                result.customersUpdated++;
            } else {
                await db.insert(customersCache).values({
                    id: crypto.randomUUID(),
                    userId,
                    zohoCustomerId: customer.externalId,
                    customerName: customer.customerName,
                    companyName: customer.companyName || null,
                    primaryPhone: customer.primaryPhone || null,
                    primaryEmail: customer.primaryEmail || null,
                    contactPersons: JSON.stringify(customer.contactPersons || []),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                result.customersInserted++;
            }
        }

        // 2. Fetch Invoices
        console.log(`[${providerName}] Fetching invoices...`);
        const invoices = await provider.getInvoices(userId);
        result.invoicesFetched = invoices.length;

        // Get Settings & Calculate Window
        const settings = await getUserSettings(userId);
        const maxReminderDays = getMaxReminderDays(settings);
        const syncWindowDays = maxReminderDays + 5;
        const now = new Date();
        const windowStart = new Date(now);
        windowStart.setDate(windowStart.getDate() - 1);
        const windowEnd = new Date(now);
        windowEnd.setDate(windowEnd.getDate() + syncWindowDays);

        // 3. Process Each Invoice
        console.log(`[${providerName}] Processing ${invoices.length} invoices...`);
        for (const inv of invoices) {
            const dueDate = new Date(inv.dueDate);

            // Map to ZohoInvoice format for compatibility
            const mappedInvoice: ZohoInvoice = {
                invoice_id: inv.externalId,
                customer_id: inv.externalCustomerId || "",
                customer_name: inv.customerName || "Unknown Customer",
                customer_phone: "", // Phone lookups are handled via customer_id inside processAndUpsertInvoice
                invoice_number: inv.invoiceNumber || "INV-???",
                total: parseFloat(inv.amountTotal || "0"),
                balance: parseFloat(inv.amountDue || "0"),
                due_date: dueDate.toISOString(),
                status: inv.status || "sent",
                last_modified_time: new Date().toISOString(),
                currency_code: inv.currencyCode,
            };

            try {
                await processAndUpsertInvoice(userId, mappedInvoice, settings, providerName);
                result.invoicesInserted++; // We roughly count this as processed
            } catch (err) {
                console.error(`[${providerName}] Failed to process invoice ${inv.externalId}`, err);
                result.errors.push(`Failed to process invoice ${inv.externalId}`);
            }
        }

        // 4. Cleanup
        console.log(`[${providerName}] Cleanup outside window...`);
        await cleanupInvoicesOutsideWindow(userId, windowStart, windowEnd);

        // 5. Update Metadata
        const metadata = await db
            .select()
            .from(syncMetadata)
            .where(eq(syncMetadata.userId, userId))
            .limit(1);

        if (metadata.length > 0) {
            await db
                .update(syncMetadata)
                .set({
                    lastIncrementalSyncAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(syncMetadata.userId, userId));
        } else {
            await db.insert(syncMetadata).values({
                id: crypto.randomUUID(),
                userId,
                lastIncrementalSyncAt: new Date(),
                lastCustomerSyncAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[${providerName} Sync Error]`, err);
        result.errors.push(msg);
    }

    const durationMs = Date.now() - syncStartTime;
    console.log(`[Sync Engine] Completed generic sync for ${userId} in ${durationMs}ms`);

    return result;
}
