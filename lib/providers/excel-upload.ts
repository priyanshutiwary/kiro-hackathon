/**
 * Excel Upload Provider
 * Reads previously uploaded Excel data from the invoicesCache / customersCache tables.
 * Unlike OAuth providers, this doesn't fetch from an external source each call —
 * data was already parsed and stored during the upload flow.
 * The getInvoices/getCustomers methods return cached data for use in the sync loop.
 */

import { db } from "@/db/drizzle";
import { invoicesCache, customersCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
    InvoiceProvider,
    NormalizedCustomer,
    NormalizedInvoice,
} from "./types";

export class ExcelUploadProvider implements InvoiceProvider {
    readonly providerName = "excel_upload";

    /**
     * Returns customers that were previously parsed from an uploaded Excel file.
     * The actual parsing happens in /api/excel/import — this just reads the cache.
     */
    async getCustomers(userId: string): Promise<NormalizedCustomer[]> {
        const rows = await db
            .select()
            .from(customersCache)
            .where(eq(customersCache.userId, userId));

        return rows
            .filter((r) => r.zohoCustomerId.startsWith("excel_"))
            .map((r) => ({
                externalId: r.zohoCustomerId,
                customerName: r.customerName,
                companyName: r.companyName || undefined,
                primaryPhone: r.primaryPhone || undefined,
                primaryEmail: r.primaryEmail || undefined,
                contactPersons: r.contactPersons
                    ? JSON.parse(r.contactPersons)
                    : [],
            }));
    }

    /**
     * Returns invoices that were previously parsed from an uploaded Excel file.
     */
    async getInvoices(userId: string): Promise<NormalizedInvoice[]> {
        const rows = await db
            .select()
            .from(invoicesCache)
            .where(eq(invoicesCache.userId, userId));

        return rows
            .filter((r) => r.zohoInvoiceId.startsWith("excel_"))
            .map((r) => ({
                externalId: r.zohoInvoiceId,
                externalCustomerId: r.customerId || undefined,
                invoiceNumber: r.invoiceNumber || undefined,
                amountTotal: r.amountTotal || undefined,
                amountDue: r.amountDue || undefined,
                currencyCode: r.currencyCode || "USD",
                dueDate: r.dueDate,
                status: r.status || undefined,
            }));
    }
}
