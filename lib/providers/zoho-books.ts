/**
 * Zoho Books Provider
 * Wraps the existing ZohoAPIClient to implement the shared InvoiceProvider interface.
 * No existing logic is changed — this is purely an adapter.
 */

import { createZohoAPIClient } from "@/lib/zoho-api-client";
import type {
    InvoiceProvider,
    NormalizedCustomer,
    NormalizedInvoice,
} from "./types";

export class ZohoBooksProvider implements InvoiceProvider {
    readonly providerName = "zoho_books";

    async getCustomers(userId: string): Promise<NormalizedCustomer[]> {
        const _client = createZohoAPIClient();
        // Zoho contacts are fetched via the existing /contacts endpoint
        // We call the API route internally to reuse all existing logic
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/zoho/contacts?limit=200`,
            {
                headers: {
                    // Internal server-to-server call — pass userId via header
                    "x-internal-user-id": userId,
                },
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const contacts: Array<{
            contact_id: string;
            contact_name: string;
            company_name?: string;
            phone?: string;
            email?: string;
            contact_persons?: Array<{
                contact_person_id?: string;
                first_name?: string;
                last_name?: string;
                phone?: string;
                email?: string;
                is_primary_contact?: boolean;
            }>;
        }> = data.contacts || [];

        return contacts.map((c) => ({
            externalId: c.contact_id,
            customerName: c.contact_name,
            companyName: c.company_name,
            primaryPhone: c.phone,
            primaryEmail: c.email,
            contactPersons: (c.contact_persons || []).map((cp) => ({
                id: cp.contact_person_id,
                name: [cp.first_name, cp.last_name].filter(Boolean).join(" "),
                phone: cp.phone,
                email: cp.email,
                isPrimary: cp.is_primary_contact,
            })),
        }));
    }

    async getInvoices(userId: string): Promise<NormalizedInvoice[]> {
        const client = createZohoAPIClient();
        const allInvoices: NormalizedInvoice[] = [];

        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const result = await client.getInvoices(userId, page, 200);

            const normalized = result.invoices.map((inv) => ({
                externalId: inv.invoiceId,
                externalCustomerId: inv.customerId,
                customerName: inv.customerName,
                invoiceNumber: inv.invoiceNumber,
                amountTotal: String(inv.total),
                amountDue: String(inv.balance),
                currencyCode: inv.currencyCode || "USD",
                dueDate: new Date(inv.dueDate),
                status: inv.status,
            }));

            allInvoices.push(...normalized);
            hasMore = result.pageContext.hasMorePage;
            page++;
        }

        return allInvoices;
    }
}
