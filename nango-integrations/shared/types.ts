/**
 * Shared TypeScript types for Nango integrations
 * These types define the normalized data structures used across all providers
 */

/**
 * Normalized customer data structure
 * All providers must map their customer data to this format
 */
export interface NormalizedCustomer {
  /** External ID from the provider system */
  externalId: string;
  /** Customer display name */
  customerName: string;
  /** Company name (optional) */
  companyName?: string;
  /** Primary email address */
  primaryEmail?: string;
  /** Primary phone number (E.164 format preferred) */
  primaryPhone?: string;
  /** List of contact persons associated with this customer */
  contactPersons?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
}

/**
 * Normalized invoice data structure
 * All providers must map their invoice data to this format
 */
export interface NormalizedInvoice {
  /** External ID from the provider system */
  externalId: string;
  /** External customer ID (references customer in provider system) */
  externalCustomerId: string;
  /** Invoice number/identifier */
  invoiceNumber: string;
  /** Total invoice amount */
  amountTotal: number;
  /** Amount still due (unpaid) */
  amountDue: number;
  /** Currency code (ISO 4217) */
  currencyCode: string;
  /** Invoice due date */
  dueDate: Date;
  /** Invoice payment status */
  status: 'paid' | 'unpaid' | 'overdue';
  /** Line items (optional) */
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}
