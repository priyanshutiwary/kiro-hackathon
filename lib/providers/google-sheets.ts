/**
 * Google Sheets Provider
 * Fetches invoice and customer data from a connected Google Spreadsheet.
 * Uses the Google Sheets API v4 with OAuth2 tokens stored in agentIntegrations.
 */

import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { refreshGoogleAccessToken, isGoogleTokenExpired } from "@/lib/google-oauth";
import { normalizePhoneNumber } from "@/lib/utils/phone-normalizer";
import type {
    InvoiceProvider,
    NormalizedCustomer,
    NormalizedInvoice,
    GoogleSheetsConfig,
} from "./types";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export class GoogleSheetsProvider implements InvoiceProvider {
    readonly providerName = "google_sheets";

    private async getAccessToken(userId: string): Promise<{ token: string; spreadsheetId: string; sheetName: string }> {
        const rows = await db
            .select()
            .from(agentIntegrations)
            .where(
                and(
                    eq(agentIntegrations.userId, userId),
                    eq(agentIntegrations.provider, "google_sheets")
                )
            )
            .limit(1);

        if (!rows.length) throw new Error("Google Sheets integration not found");
        const integration = rows[0];

        const config: GoogleSheetsConfig = integration.config
            ? JSON.parse(integration.config)
            : {};

        if (!config.spreadsheetId) {
            throw new Error("No spreadsheet linked. Please set a Google Sheet URL in your integration settings.");
        }

        // Refresh token if expired
        let accessToken = integration.accessToken ? decrypt(integration.accessToken) : "";
        const expiresAt = integration.accessTokenExpiresAt || new Date(0);

        if (isGoogleTokenExpired(expiresAt)) {
            const refreshToken = integration.refreshToken ? decrypt(integration.refreshToken) : "";
            if (!refreshToken) throw new Error("No refresh token — please reconnect Google Sheets");

            const newTokens = await refreshGoogleAccessToken(refreshToken);
            accessToken = newTokens.accessToken;

            // Update tokens in DB
            const { encrypt } = await import("@/lib/encryption");
            await db
                .update(agentIntegrations)
                .set({
                    accessToken: encrypt(newTokens.accessToken),
                    accessTokenExpiresAt: newTokens.expiresAt,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(agentIntegrations.userId, userId),
                        eq(agentIntegrations.provider, "google_sheets")
                    )
                );
        }

        return {
            token: accessToken,
            spreadsheetId: config.spreadsheetId,
            sheetName: config.sheetName || "Sheet1",
        };
    }

    private async fetchSheetRows(
        token: string,
        spreadsheetId: string,
        sheetName: string
    ): Promise<string[][]> {
        let safeSheetName = sheetName.replace(/'/g, "''");
        let range = encodeURIComponent(`'${safeSheetName}'`);
        let url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}`;

        let response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const err = await response.text();

            // Fallback: If range is invalid, try to get the first sheet's name
            if (response.status === 400 && err.includes("Unable to parse range")) {
                console.warn(`[Google Sheets] Sheet '${sheetName}' not found. Attempting to fallback to the first sheet...`);

                const metaUrl = `${SHEETS_API_BASE}/${spreadsheetId}`;
                const metaResponse = await fetch(metaUrl, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (metaResponse.ok) {
                    const metaData = await metaResponse.json();
                    const sheets = metaData.sheets || [];
                    if (sheets.length > 0 && sheets[0].properties?.title) {
                        const firstSheetName = sheets[0].properties.title;
                        console.log(`[Google Sheets] Falling back to first sheet: '${firstSheetName}'`);

                        safeSheetName = firstSheetName.replace(/'/g, "''");
                        range = encodeURIComponent(`'${safeSheetName}'`);
                        url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}`;

                        response = await fetch(url, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        if (!response.ok) {
                            const retryErr = await response.text();
                            throw new Error(`Google Sheets API error on fallback: ${response.status} ${retryErr}`);
                        }
                    } else {
                        throw new Error(`Google Sheets API error: ${response.status} ${err}`);
                    }
                } else {
                    throw new Error(`Google Sheets API error: ${response.status} ${err}`);
                }
            } else {
                throw new Error(`Google Sheets API error: ${response.status} ${err}`);
            }
        }

        const data = await response.json();
        return (data.values as string[][]) || [];
    }

    /**
     * Maps raw sheet rows to NormalizedInvoice.
     * Expected columns (case-insensitive header row):
     *   invoice_number | customer_name | customer_id | customer_phone | customer_email | amount_total | amount_due | currency | due_date | status
     */
    async getInvoices(userId: string): Promise<NormalizedInvoice[]> {
        const { token, spreadsheetId, sheetName } = await this.getAccessToken(userId);
        const rows = await this.fetchSheetRows(token, spreadsheetId, sheetName);

        if (rows.length < 2) return []; // No data rows

        const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/\s+/g, "_"));

        const col = (name: string) => headers.indexOf(name);

        return rows.slice(1).map((row, i) => {
            const get = (name: string) => row[col(name)]?.trim() || undefined;

            const dueDateRaw = get("due_date");
            let dueDate: Date;
            try {
                dueDate = dueDateRaw ? new Date(dueDateRaw) : new Date();
            } catch {
                dueDate = new Date();
            }

            return {
                // Row index as external ID since sheets don't have native IDs
                externalId: `gs_row_${i + 2}_${get("invoice_number") || i}`,
                externalCustomerId: get("customer_id"),
                customerName: get("customer_name"),
                invoiceNumber: get("invoice_number"),
                amountTotal: get("amount_total"),
                amountDue: get("amount_due"),
                currencyCode: get("currency") || "USD",
                dueDate,
                status: get("status") || "open",
            };
        }).filter((inv) => !isNaN(inv.dueDate.getTime()));
    }

    /**
     * For Google Sheets, customers are inferred from the invoice rows
     * (no separate customers sheet assumed by default).
     */
    async getCustomers(userId: string): Promise<NormalizedCustomer[]> {
        const { token, spreadsheetId, sheetName } = await this.getAccessToken(userId);
        const rows = await this.fetchSheetRows(token, spreadsheetId, sheetName);

        if (rows.length < 2) return []; // No data rows

        const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/\s+/g, "_"));
        const col = (name: string) => headers.indexOf(name);

        // Deduplicate by externalCustomerId or customerName
        const seen = new Set<string>();
        const customers: NormalizedCustomer[] = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const get = (name: string) => row[col(name)]?.trim() || undefined;

            const customerId = get("customer_id");
            const customerName = get("customer_name");
            const key = customerId || customerName || "";
            
            if (!key || seen.has(key)) continue;
            seen.add(key);

            // Get and normalize phone number
            const rawPhone = get("customer_phone") || get("phone");
            let normalizedPhone: string | undefined;
            
            if (rawPhone) {
                const phoneResult = normalizePhoneNumber(rawPhone, 'IN');
                if (phoneResult.success) {
                    normalizedPhone = phoneResult.normalized;
                    console.log(`[Google Sheets] Normalized phone: ${rawPhone} -> ${normalizedPhone}`);
                } else {
                    console.warn(`[Google Sheets] Failed to normalize phone for ${customerName}: ${rawPhone} - ${phoneResult.error}`);
                    // Keep original if normalization fails
                    normalizedPhone = rawPhone;
                }
            }

            customers.push({
                externalId: customerId || `gs_customer_${key}`,
                customerName: customerName || key,
                primaryPhone: normalizedPhone,
                primaryEmail: get("customer_email") || get("email"),
            });
        }

        return customers;
    }
}
