/**
 * Provider Registry
 * Central registry of all available invoice data source providers.
 * To add a new provider: create a new file implementing InvoiceProvider,
 * then add one entry here. Nothing else needs to change.
 */

import { ZohoBooksProvider } from "./zoho-books";
import { GoogleSheetsProvider } from "./google-sheets";
import { ExcelUploadProvider } from "./excel-upload";
import type { InvoiceProvider } from "./types";

const registry: Record<string, InvoiceProvider> = {
    zoho_books: new ZohoBooksProvider(),
    google_sheets: new GoogleSheetsProvider(),
    excel_upload: new ExcelUploadProvider(),
    // Future providers — just uncomment when ready:
    // zoho_invoices: new ZohoInvoicesProvider(),
    // quickbooks:    new QuickBooksProvider(),
    // excel_onedrive: new OneDriveExcelProvider(),
};

/**
 * Get a provider by its name (matches the `provider` column in agentIntegrations).
 * Returns undefined if the provider is not registered.
 */
export function getProvider(providerName: string): InvoiceProvider | undefined {
    return registry[providerName];
}

/**
 * Get all registered provider names.
 */
export function getAllProviderNames(): string[] {
    return Object.keys(registry);
}

export { registry as providers };
