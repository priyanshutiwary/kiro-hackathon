/**
 * QuickBooks Fetch Invoices Action
 * 
 * Fetches invoices from QuickBooks using the Query API endpoint.
 * Handles pagination, normalization, and error handling.
 * 
 * QuickBooks API Reference:
 * https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice
 */

import { createAction } from 'nango';
import { z } from 'zod';
import type { NormalizedInvoice } from '../../shared/types.js';
import {
  normalizeDate,
  normalizeCurrency,
  determineInvoiceStatus,
  parseNumber,
} from '../../shared/normalizers.js';

// Input schema
const InputSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// QuickBooks Invoice API response types
interface QBInvoice {
  Id: string;
  DocNumber: string;
  CustomerRef: {
    value: string;
    name?: string;
  };
  TotalAmt: number;
  Balance: number;
  CurrencyRef?: {
    value: string;
  };
  DueDate: string;
  TxnDate: string;
  Line?: Array<{
    Description?: string;
    Amount: number;
    SalesItemLineDetail?: {
      Qty?: number;
      UnitPrice?: number;
    };
  }>;
}

interface QBQueryResponse {
  QueryResponse: {
    Invoice?: QBInvoice[];
    maxResults?: number;
    startPosition?: number;
  };
}

/**
 * Normalize QuickBooks invoice to InvoCall format
 */
function normalizeInvoice(qbInvoice: QBInvoice): NormalizedInvoice {
  const dueDate = normalizeDate(qbInvoice.DueDate);
  const amountDue = parseNumber(qbInvoice.Balance, 0);

  const items = qbInvoice.Line?.filter(line => line.Description).map(line => ({
    description: line.Description || '',
    quantity: parseNumber(line.SalesItemLineDetail?.Qty, 1),
    rate: parseNumber(line.SalesItemLineDetail?.UnitPrice, 0),
    amount: parseNumber(line.Amount, 0),
  }));

  return {
    externalId: qbInvoice.Id,
    externalCustomerId: qbInvoice.CustomerRef.value,
    invoiceNumber: qbInvoice.DocNumber,
    amountTotal: parseNumber(qbInvoice.TotalAmt, 0),
    amountDue,
    currencyCode: normalizeCurrency(qbInvoice.CurrencyRef?.value),
    dueDate: dueDate || new Date(),
    status: determineInvoiceStatus(amountDue, dueDate),
    ...(items && items.length > 0 && { items }),
  };
}

/**
 * Build QuickBooks SQL query for invoices
 */
function buildInvoiceQuery(startDate?: string, endDate?: string): string {
  let query = 'SELECT * FROM Invoice';
  const conditions: string[] = [];

  if (startDate) {
    conditions.push(`TxnDate >= '${startDate}'`);
  }

  if (endDate) {
    conditions.push(`TxnDate <= '${endDate}'`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  return query;
}

export default createAction({
  description: 'Fetches invoices from QuickBooks',
  version: '1.0.0',
  input: InputSchema,
  output: z.array(z.any()), // NormalizedInvoice array
  exec: async (nango, input) => {
    try {
      await nango.log('Starting QuickBooks invoice fetch');

      const allInvoices: NormalizedInvoice[] = [];
      const maxResults = 100; // QuickBooks max per page
      let startPosition = 1;
      let hasMore = true;

      // Build base query
      const baseQuery = buildInvoiceQuery(input.startDate, input.endDate);

      // Paginate through results
      while (hasMore) {
        const query = `${baseQuery} STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
        
        await nango.log(`Fetching invoices: ${query}`);

        // Make API call to QuickBooks
        const response = await nango.get<QBQueryResponse>({
          endpoint: '/v3/company/query',
          params: {
            query,
            minorversion: '65', // Latest minor version
          },
        });

        const invoices = response.data.QueryResponse.Invoice || [];
        
        await nango.log(`Fetched ${invoices.length} invoices from position ${startPosition}`);

        // Normalize and add to results
        const normalized = invoices.map(normalizeInvoice);
        allInvoices.push(...normalized);

        // Check if there are more results
        hasMore = invoices.length === maxResults;
        startPosition += maxResults;

        // Safety check to prevent infinite loops
        if (startPosition > 10000) {
          await nango.log('Warning: Reached maximum pagination limit (10000 records)');
          break;
        }
      }

      await nango.log(`Successfully fetched and normalized ${allInvoices.length} total invoices`);

      return allInvoices;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await nango.log(`Error fetching invoices: ${errorMessage}`, { level: 'error' });
      throw new Error(`Failed to fetch QuickBooks invoices: ${errorMessage}`);
    }
  },
});
