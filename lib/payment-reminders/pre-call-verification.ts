/**
 * Pre-Call Verification Module
 * 
 * Handles invoice status verification before making calls and prepares fresh context
 * for the voice agent.
 * 
 * Requirements: 7.1-7.6, 14.1-14.9
 */

import { db } from "@/db/drizzle";
import { invoicesCache, customersCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ZohoBooksClient, ZohoInvoice } from "./zoho-books-client";
import { getBusinessProfile, getDefaultBusinessProfile} from "@/lib/business-profile/service";
import { getCurrencySymbol } from "@/lib/currency-utils";

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
 * Business profile context for voice agent
 */
export interface BusinessProfileContext {
  companyName: string;
  businessDescription: string;
  industry: string | null;
  supportPhone: string;
  supportEmail: string | null;
  preferredPaymentMethods: string[];
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
  currencyCode: string; // ISO currency code (USD, INR, EUR, etc.)
  currencySymbol: string; // Currency symbol ($, ₹, €, etc.)
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
  paymentMethods: string[];
  companyName: string;
  supportPhone: string;
  businessProfile: BusinessProfileContext;
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
    console.log(`[Pre-call Verification] Fetching invoice ${zohoInvoiceId} from Zoho Books...`);
    
    // Fetch latest invoice data from Zoho Books (Requirement 7.1)
    const latestInvoice: ZohoInvoice = await zohoClient.getInvoiceById(
      userId,
      zohoInvoiceId,
      organizationId
    );
    
    console.log(`[Pre-call Verification] Invoice fetched successfully. Status: ${latestInvoice.status}, Balance: ${latestInvoice.balance}`);
    
    // Check if invoice is paid (Requirement 7.2)
    const isPaid = latestInvoice.status.toLowerCase() === 'paid';
    
    // Invoice should be called if it has an outstanding balance and is not paid
    // Valid statuses for calling: sent, unpaid, overdue, partially_paid
    const validStatusesForCalling = ['sent', 'unpaid', 'overdue', 'partially_paid'];
    const isValidStatus = validStatusesForCalling.includes(latestInvoice.status.toLowerCase());
    const hasBalance = latestInvoice.balance > 0;
    
    console.log(`[Pre-call Verification] isPaid: ${isPaid}, isValidStatus: ${isValidStatus}, hasBalance: ${hasBalance}`);
    
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
    // Proceed if: not paid AND has valid status AND has outstanding balance
    const shouldProceed = !isPaid && isValidStatus && hasBalance;
    
    console.log(`[Pre-call Verification] shouldProceed: ${shouldProceed}`);
    
    return {
      isPaid,
      currentStatus: latestInvoice.status,
      amountDue: latestInvoice.balance,
      shouldProceed,
    };
  } catch (error) {
    // If we can't verify, log error and don't proceed with call
    console.error('[Pre-call Verification] Error verifying invoice status:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[Pre-call Verification] Error message:', error.message);
      console.error('[Pre-call Verification] Error stack:', error.stack);
    }
    
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
 * invoice amounts, due dates, payment information, and business profile.
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
  // Fetch invoice from cache with customer information (should have latest data from verification)
  const invoices = await db
    .select({
      id: invoicesCache.id,
      customerId: invoicesCache.customerId,
      invoiceNumber: invoicesCache.invoiceNumber,
      amountTotal: invoicesCache.amountTotal,
      amountDue: invoicesCache.amountDue,
      currencyCode: invoicesCache.currencyCode,
      dueDate: invoicesCache.dueDate,
      customerName: customersCache.customerName,
    })
    .from(invoicesCache)
    .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
    .where(eq(invoicesCache.id, invoiceId))
    .limit(1);
  
  if (invoices.length === 0) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }
  
  const invoice = invoices[0];
  
  // Fetch business profile
  const businessProfile = await getBusinessProfile(userId);
  const defaultProfile = getDefaultBusinessProfile();
  
  // Use business profile data or fallback to defaults
  const profileData = businessProfile || defaultProfile;
  
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
  
  // Format payment methods
  const paymentMethods = profileData.preferredPaymentMethods || ['online payment portal', 'bank transfer', 'check'];
  
  // Build business profile context
  const businessProfileContext: BusinessProfileContext = {
    companyName: profileData.companyName || 'Your Company',
    businessDescription: profileData.businessDescription || 'A professional business providing quality services to our customers.',
    industry: profileData.industry || null,
    supportPhone: profileData.supportPhone || '1-800-555-0100',
    supportEmail: profileData.supportEmail || null,
    preferredPaymentMethods: profileData.preferredPaymentMethods || ['credit_card', 'bank_transfer', 'check'],
  };
  
  // Build call context (Requirements 14.1-14.9)
  const currencyCode = invoice.currencyCode || 'USD';
  const currencySymbol = getCurrencySymbol(currencyCode);
  
  const context: CallContext = {
    customerName: invoice.customerName || 'Customer', // Requirement 14.1
    invoiceNumber: invoice.invoiceNumber || 'Unknown', // Requirement 14.2
    originalAmount: parseFloat(invoice.amountTotal || '0'), // Requirement 14.3
    amountDue: parseFloat(invoice.amountDue || '0'), // Requirement 14.4
    currencyCode, // Currency code for the invoice
    currencySymbol, // Currency symbol for voice agent
    dueDate: dueDateFormatted, // Requirement 14.5
    daysUntilDue, // Requirement 14.6
    isOverdue,
    paymentMethods, // Requirement 14.7
    companyName: businessProfileContext.companyName, // Requirement 14.8
    supportPhone: businessProfileContext.supportPhone, // Requirement 14.9
    businessProfile: businessProfileContext,
  };
  
  return context;
}
