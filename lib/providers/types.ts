/**
 * Shared provider interfaces for all invoice data source integrations.
 * Every provider (Zoho Books, Google Sheets, Excel, future) implements InvoiceProvider.
 * Data is normalized into NormalizedCustomer / NormalizedInvoice before being
 * written to the DB cache — so the reminder engine is provider-agnostic.
 */

// ─── Normalized Data Types ────────────────────────────────────────────────────

export interface NormalizedCustomer {
    /** Provider-specific unique ID (zoho contact_id, sheet row key, etc.) */
    externalId: string;
    customerName: string;
    companyName?: string;
    primaryPhone?: string;
    primaryEmail?: string;
    contactPersons?: NormalizedContactPerson[];
}

export interface NormalizedContactPerson {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
}

export interface NormalizedInvoice {
    /** Provider-specific unique ID */
    externalId: string;
    /** Matches externalId in NormalizedCustomer */
    externalCustomerId?: string;
    customerName?: string;
    invoiceNumber?: string;
    amountTotal?: string;
    amountDue?: string;
    currencyCode: string;
    /** ISO date string or Date */
    dueDate: Date;
    status?: string;
}

// ─── Provider Interface ───────────────────────────────────────────────────────

/**
 * Every invoice data source must implement this interface.
 * Adding a new provider = 1 new file that implements this + 1 registry entry.
 */
export interface InvoiceProvider {
    /** Matches the `provider` column in agentIntegrations table */
    readonly providerName: string;

    /**
     * Fetch all customers for the given user from the external source.
     * Implementations handle their own auth/token refresh internally.
     */
    getCustomers(userId: string): Promise<NormalizedCustomer[]>;

    /**
     * Fetch all invoices for the given user from the external source.
     */
    getInvoices(userId: string): Promise<NormalizedInvoice[]>;
}

// ─── Stored Integration Config Types ─────────────────────────────────────────
// These are the typed shapes stored in agentIntegrations.config (JSON string)

export interface ZohoBooksConfig {
    organizationId: string;
    accountsServer: string;
    apiDomain: string;
}

export interface GoogleSheetsConfig {
    spreadsheetId?: string;
    sheetName?: string;
    /** Maps sheet column letters/names to normalized field names */
    headerMapping?: Record<string, string>;
}

export interface ExcelUploadConfig {
    lastUploadedAt?: string;
    rowCount?: number;
}

export interface OneDriveExcelConfig {
    fileId?: string;
    driveType?: "personal" | "sharepoint";
}

/** Union of all known provider configs */
export type ProviderConfig =
    | ZohoBooksConfig
    | GoogleSheetsConfig
    | ExcelUploadConfig
    | OneDriveExcelConfig;
