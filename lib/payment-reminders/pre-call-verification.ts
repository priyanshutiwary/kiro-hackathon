/**
 * Pre-Call Verification Module
 * 
 * Handles invoice status verification before making calls and prepares fresh context
 * for the voice agent.
 * 
 * Requirements: 7.1-7.6, 14.1-14.9
 */

import { db } from "@/db/drizzle";
import { invoicesCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ZohoBooksClient, ZohoInvoice } from "./zoho-books-client";

/**
 * Invoice verification result
 * Indicates whether a call should proceed based on current invoice status
 */
export interface InvoiceVerification {
  isPaid: boolean;
  currentStatus: string;
  amountDue: number;
  shouldProceed: boolean;
}

/**
 * Call context for voice agent
 * Contains all information needed for the agent to have a meaningful conversation
 */
export interface CallContext {
  customerName: string;
  invoiceNumber: string;
  originalAmount: number;
  amountDue: number;
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
  paymentMethods: string[];
  companyName: string;
  supportPhone: string;
}

/**
 * Verifies invoice status before making a call
 * 
 * Fetches the latest invoice data from Zoho Books to ensure we don't call
 * customers about invoices they've already paid.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * @param userId - User ID who owns the invoice
 * @param invoiceId - Local invoice cache ID
 * @param zohoInvoiceId - Zoho Books invoice ID
 * @param organizationId - Zoho organization ID
 * @returns Verification result indicating if call should proceed
 */
export async function verifyInvoiceStatus(
  userId: string,
  invoiceId: string,
  zohoInvoiceId: string,
  organizationId: string
): Promise<InvoiceVerification> {
  // Create Zoho Books client
  const zohoClient = new ZohoBooksClient();
  
  try {
    // Fetch latest invoice data from Zoho Books (Requirement 7.1)
    const latestInvoice: ZohoInvoice = await zohoClient.getInvoiceById(
      userId,
      zohoInvoiceId,
      organizationId
    );
    
    // Check if invoice is paid (Requirement 7.2)
    const isPaid = latestInvoice.status.toLowerCase() === 'paid';
    const isUnpaidOrPartial = 
      latestInvoice.status.toLowerCase() === 'unpaid' || 
      latestInvoice.status.toLowerCase() === 'partially_paid';
    
    // Update cached invoice status (Requirement 7.4)
    await db
      .update(invoicesCache)
      .set({
        status: latestInvoice.status,
        amountDue: latestInvoice.balance.toString(),
        zohoLastModifiedAt: new Date(latestInvoice.last_modified_time),
        localLastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoicesCache.id, invoiceId));
    
    // Determine if call should proceed (Requirements 7.2, 7.3)
    const shouldProceed = isUnpaidOrPartial;
    
    return {
      isPaid,
      currentStatus: latestInvoice.status,
      amountDue: latestInvoice.balance,
      shouldProceed,
    };
  } catch (error) {
    // If we can't verify, log error and don't proceed with call
    console.error('Error verifying invoice status:', error);
    
    // Return conservative result - don't make the call if we can't verify
    return {
      isPaid: false,
      currentStatus: 'unknown',
      amountDue: 0,
      shouldProceed: false,
    };
  }
}

/**
 * Prepares fresh call context from verified invoice data
 * 
 * Builds complete context for the voice agent including customer details,
 * invoice amounts, due dates, and payment information.
 * 
 * Requirements: 7.6, 14.1-14.9
 * 
 * @param invoiceId - Local invoice cache ID
 * @param userId - User ID who owns the invoice
 * @returns Call context ready for voice agent
 */
export async function prepareFreshContext(
  invoiceId: string,
  userId: string
): Promise<CallContext> {
  // Fetch invoice from cache (should have latest data from verification)
  const invoices = await db
    .select()
    .from(invoicesCache)
    .where(eq(invoicesCache.id, invoiceId))
    .limit(1);
  
  if (invoices.length === 0) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }
  
  const invoice = invoices[0];
  
  // Calculate days until due or overdue (Requirement 14.6)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(invoice.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  const daysUntilDue = isOverdue ? Math.abs(diffDays) : diffDays;
  
  // Format due date for voice agent (Requirement 14.5)
  const dueDateFormatted = dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Build call context (Requirements 14.1-14.9)
  const context: CallContext = {
    customerName: invoice.customerName || 'Customer', // Requirement 14.1
    invoiceNumber: invoice.invoiceNumber || 'Unknown', // Requirement 14.2
    originalAmount: parseFloat(invoice.amountTotal || '0'), // Requirement 14.3
    amountDue: parseFloat(invoice.amountDue || '0'), // Requirement 14.4
    dueDate: dueDateFormatted, // Requirement 14.5
    daysUntilDue, // Requirement 14.6
    isOverdue,
    paymentMethods: ['online payment portal', 'bank transfer', 'check'], // Requirement 14.7
    companyName: 'Your Company', // Requirement 14.8 - TODO: Make this configurable
    supportPhone: '1-800-555-0100', // Requirement 14.9 - TODO: Make this configurable
  };
  
  return context;
}
