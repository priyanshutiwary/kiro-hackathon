/**
 * Invoice Hash Calculation and Change Detection
 * Implements hash-based change detection for invoice synchronization
 */

import crypto from 'crypto';
import { ZohoInvoice } from './zoho-books-client';

/**
 * Invoice changes detected during sync
 */
export interface InvoiceChanges {
  dueDateChanged: boolean;
  amountChanged: boolean;
  statusChanged: boolean;
  phoneChanged: boolean;
}

/**
 * Cached invoice data for comparison
 */
export interface CachedInvoice {
  invoiceNumber: string;
  amountTotal: string;
  amountDue: string;
  dueDate: Date;
  status: string;
  customerPhone: string;
  syncHash: string;
}

/**
 * Calculate SHA-256 hash of relevant invoice fields
 * 
 * The hash includes:
 * - invoice_number: Unique identifier
 * - total: Original invoice amount
 * - balance: Current amount due
 * - due_date: Payment due date
 * - status: Invoice status (paid, unpaid, etc.)
 * - customer_phone: Customer contact number
 * 
 * @param invoice - Zoho invoice data
 * @returns SHA-256 hash as hex string
 * 
 * Requirements: 4.1
 */
export function calculateInvoiceHash(invoice: ZohoInvoice): string {
  // Create a deterministic string representation of relevant fields
  const hashInput = [
    invoice.invoice_number,
    invoice.total.toString(),
    invoice.balance.toString(),
    invoice.due_date,
    invoice.status,
    invoice.customer_phone || '',
  ].join('|');

  // Calculate SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('hex');
}

/**
 * Detect changes between existing cached invoice and Zoho invoice
 * 
 * Compares relevant fields to identify what has changed:
 * - Due date changes trigger reminder recreation
 * - Amount changes update cached values
 * - Status changes (to paid) cancel reminders
 * - Phone changes update contact information
 * 
 * @param existingInvoice - Cached invoice from database
 * @param zohoInvoice - Fresh invoice data from Zoho Books
 * @returns Object with flags for each change type
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */
export function detectChanges(
  existingInvoice: CachedInvoice,
  zohoInvoice: ZohoInvoice
): InvoiceChanges {
  // Parse due dates for comparison
  const existingDueDate = new Date(existingInvoice.dueDate);
  const zohoInvoiceDueDate = new Date(zohoInvoice.due_date);

  // Normalize dates to compare only date parts (ignore time)
  const existingDateOnly = new Date(
    existingDueDate.getFullYear(),
    existingDueDate.getMonth(),
    existingDueDate.getDate()
  );
  const zohoDateOnly = new Date(
    zohoInvoiceDueDate.getFullYear(),
    zohoInvoiceDueDate.getMonth(),
    zohoInvoiceDueDate.getDate()
  );

  return {
    dueDateChanged: existingDateOnly.getTime() !== zohoDateOnly.getTime(),
    amountChanged:
      parseFloat(existingInvoice.amountTotal) !== zohoInvoice.total ||
      parseFloat(existingInvoice.amountDue) !== zohoInvoice.balance,
    statusChanged: existingInvoice.status !== zohoInvoice.status,
    phoneChanged: existingInvoice.customerPhone !== (zohoInvoice.customer_phone || ''),
  };
}
