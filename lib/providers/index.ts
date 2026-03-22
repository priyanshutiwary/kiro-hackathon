/**
 * Provider Registry
 * Central registry of all available invoice data source providers.
 * To add a new provider: create a new file implementing InvoiceProvider,
 * then add one entry here. Nothing else needs to change.
 */

import { ZohoBooksProvider } from "./zoho-books";
import { GoogleSheetsProvider } from "./google-sheets";
import { ExcelUploadProvider } from "./excel-upload";
import { QuickBooksProvider } from "./quickbooks";
import type { InvoiceProvider } from "./types";
import { NangoProviderBase } from "./nango-base";

const registry: Record<string, InvoiceProvider> = {
    zoho_books: new ZohoBooksProvider(),
    google_sheets: new GoogleSheetsProvider(),
    excel_upload: new ExcelUploadProvider(),
    quickbooks: new QuickBooksProvider(),
    // Future providers — just uncomment when ready:
    // zoho_invoices: new ZohoInvoicesProvider(),
    // excel_onedrive: new OneDriveExcelProvider(),
};

/**
 * Get a provider by its name (matches the `provider` column in agentIntegrations).
 * Returns undefined if the provider is not registered.
 * 
 * Supports both custom providers (Zoho, Google Sheets, Excel) and Nango-based providers (QuickBooks, etc.)
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

/**
 * Type guard to check if a provider is a Nango-based provider
 * 
 * @param provider - The provider to check
 * @returns true if the provider extends NangoProviderBase, false otherwise
 * 
 * @example
 * ```typescript
 * const provider = getProvider('quickbooks');
 * if (provider && isNangoProvider(provider)) {
 *   // Provider uses Nango for OAuth and data fetching
 *   console.log('Nango integration ID:', provider.integrationId);
 * }
 * ```
 */
export function isNangoProvider(provider: InvoiceProvider): provider is NangoProviderBase {
    return provider instanceof NangoProviderBase;
}

/**
 * Type guard to check if a provider is a custom (non-Nango) provider
 * 
 * @param provider - The provider to check
 * @returns true if the provider is a custom implementation, false if it's Nango-based
 * 
 * @example
 * ```typescript
 * const provider = getProvider('zoho_books');
 * if (provider && isCustomProvider(provider)) {
 *   // Provider uses custom OAuth and API implementation
 * }
 * ```
 */
export function isCustomProvider(provider: InvoiceProvider): boolean {
    return !isNangoProvider(provider);
}

/**
 * Get all Nango-based provider names
 * 
 * @returns Array of provider names that use Nango
 */
export function getNangoProviderNames(): string[] {
    return Object.entries(registry)
        .filter(([_, provider]) => isNangoProvider(provider))
        .map(([name, _]) => name);
}

/**
 * Get all custom (non-Nango) provider names
 * 
 * @returns Array of provider names that use custom implementations
 */
export function getCustomProviderNames(): string[] {
    return Object.entries(registry)
        .filter(([_, provider]) => isCustomProvider(provider))
        .map(([name, _]) => name);
}

export { registry as providers };
