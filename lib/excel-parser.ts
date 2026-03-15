/**
 * Excel Parser
 * Parses .xlsx / .xls files into NormalizedInvoice and NormalizedCustomer arrays.
 * Uses the SheetJS (xlsx) library.
 *
 * Expected sheet columns (case-insensitive, header row 1):
 *   invoice_number | customer_name | customer_id | amount_total | amount_due | currency | due_date | status
 *
 * Extra columns are ignored — users can have any additional data in their sheet.
 */

import * as XLSX from "xlsx";
import type { NormalizedCustomer, NormalizedInvoice } from "./providers/types";
import { normalizePhoneNumber } from "./utils/phone-normalizer";
import crypto from "crypto";

interface ParsedExcelResult {
    invoices: NormalizedInvoice[];
    customers: NormalizedCustomer[];
}

/**
 * Parse an Excel file buffer into normalized invoices and customers.
 * @param buffer - Raw file buffer from the upload
 * @param sheetName - Sheet to read from (defaults to first sheet)
 */
export function parseExcelFile(
    buffer: Buffer | ArrayBuffer,
    sheetName?: string
): ParsedExcelResult {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // Use specified sheet or default to the first one
    const targetSheet = sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheet];

    if (!sheet) {
        throw new Error(
            `Sheet "${targetSheet}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
        );
    }

    // Convert to array of objects using header row
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number | Date>>(sheet, {
        defval: "",
        raw: false, // Parse dates as strings
    });

    if (rows.length === 0) {
        return { invoices: [], customers: [] };
    }

    // Normalize header keys: lowercase + underscores
    const normalize = (key: string) =>
        key.toLowerCase().trim().replace(/[\s-]+/g, "_");

    const invoices: NormalizedInvoice[] = [];
    const customerMap = new Map<string, NormalizedCustomer>();

    rows.forEach((rawRow, rowIndex) => {
        // Re-key the row with normalized column names
        const row: Record<string, string> = {};
        for (const [key, val] of Object.entries(rawRow)) {
            row[normalize(key)] = String(val ?? "").trim();
        }

        const get = (name: string): string | undefined =>
            row[name] || undefined;

        // Parse due date (supports YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, serial numbers)
        const rawDate = get("due_date");
        let dueDate: Date;
        try {
            dueDate = rawDate ? new Date(rawDate) : new Date();
            if (isNaN(dueDate.getTime())) dueDate = new Date();
        } catch {
            dueDate = new Date();
        }

        // Generate a stable external ID based on invoice number or row index
        const invoiceNum = get("invoice_number") || get("invoice_no") || get("inv_no");
        const customerName = get("customer_name") || get("customer") || get("client_name");
        const customerId = get("customer_id") || get("client_id");

        const externalId = `excel_inv_${invoiceNum || rowIndex + 2}_${crypto.randomBytes(4).toString("hex")}`;
        const externalCustomerId = customerId
            ? `excel_cust_${customerId}`
            : customerName
                ? `excel_cust_${customerName.replace(/\s+/g, "_").toLowerCase()}`
                : undefined;

        invoices.push({
            externalId,
            externalCustomerId,
            customerName,
            invoiceNumber: invoiceNum,
            amountTotal: get("amount_total") || get("total") || get("amount"),
            amountDue: get("amount_due") || get("balance") || get("outstanding"),
            currencyCode: get("currency") || get("currency_code") || "USD",
            dueDate,
            status: get("status") || "open",
        });

        // Build customer map (deduplicated)
        if (externalCustomerId && !customerMap.has(externalCustomerId)) {
            const rawPhone = get("phone") || get("customer_phone");
            let normalizedPhone: string | undefined;

            // Normalize phone number if present
            if (rawPhone) {
                const phoneResult = normalizePhoneNumber(rawPhone, 'IN');
                if (phoneResult.success) {
                    normalizedPhone = phoneResult.normalized;
                } else {
                    console.warn(`[Excel Parser] Failed to normalize phone: ${rawPhone} - ${phoneResult.error}`);
                    normalizedPhone = rawPhone; // Keep original if normalization fails
                }
            }

            customerMap.set(externalCustomerId, {
                externalId: externalCustomerId,
                customerName: customerName || externalCustomerId,
                primaryPhone: normalizedPhone,
                primaryEmail: get("email") || get("customer_email"),
            });
        }
    });

    return {
        invoices: invoices.filter((inv) => !isNaN(inv.dueDate.getTime())),
        customers: Array.from(customerMap.values()),
    };
}

/**
 * Get the list of sheet names from an Excel file.
 */
export function getSheetNames(buffer: Buffer | ArrayBuffer): string[] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    return workbook.SheetNames;
}
