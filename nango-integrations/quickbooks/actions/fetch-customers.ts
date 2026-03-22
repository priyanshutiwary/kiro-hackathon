/**
 * QuickBooks Fetch Customers Action
 * 
 * Fetches customers from QuickBooks using the Query API endpoint.
 * Handles pagination, normalization, and error handling.
 * 
 * QuickBooks API Reference:
 * https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/customer
 */

import { createAction } from 'nango';
import { z } from 'zod';
import type { NormalizedCustomer } from '../../shared/types.js';
import {
  normalizeEmail,
  normalizePhone,
} from '../../shared/normalizers.js';

// QuickBooks Customer API response types
interface QBCustomer {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  Mobile?: {
    FreeFormNumber: string;
  };
  AlternatePhone?: {
    FreeFormNumber: string;
  };
}

interface QBQueryResponse {
  QueryResponse: {
    Customer?: QBCustomer[];
    maxResults?: number;
    startPosition?: number;
  };
}

/**
 * Normalize QuickBooks customer to InvoCall format
 */
function normalizeCustomer(qbCustomer: QBCustomer): NormalizedCustomer {
  const primaryEmail = normalizeEmail(qbCustomer.PrimaryEmailAddr?.Address);
  const primaryPhone = normalizePhone(
    qbCustomer.PrimaryPhone?.FreeFormNumber || 
    qbCustomer.Mobile?.FreeFormNumber
  );

  // Build contact persons array if we have name information
  const contactPersons: Array<{ name: string; email?: string; phone?: string }> = [];
  
  if (qbCustomer.GivenName || qbCustomer.FamilyName) {
    const fullName = [qbCustomer.GivenName, qbCustomer.FamilyName]
      .filter(Boolean)
      .join(' ');
    
    if (fullName) {
      contactPersons.push({
        name: fullName,
        ...(primaryEmail && { email: primaryEmail }),
        ...(primaryPhone && { phone: primaryPhone }),
      });
    }
  }

  return {
    externalId: qbCustomer.Id,
    customerName: qbCustomer.DisplayName,
    ...(qbCustomer.CompanyName && { companyName: qbCustomer.CompanyName }),
    ...(primaryEmail && { primaryEmail }),
    ...(primaryPhone && { primaryPhone }),
    ...(contactPersons.length > 0 && { contactPersons }),
  };
}

export default createAction({
  description: 'Fetches customers from QuickBooks',
  version: '1.0.0',
  input: z.void(),
  output: z.array(z.any()), // NormalizedCustomer array
  exec: async (nango) => {
    try {
      await nango.log('Starting QuickBooks customer fetch');

      const allCustomers: NormalizedCustomer[] = [];
      const maxResults = 100; // QuickBooks max per page
      let startPosition = 1;
      let hasMore = true;

      // Paginate through results
      while (hasMore) {
        const query = `SELECT * FROM Customer STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
        
        await nango.log(`Fetching customers: ${query}`);

        // Make API call to QuickBooks
        const response = await nango.get<QBQueryResponse>({
          endpoint: '/v3/company/query',
          params: {
            query,
            minorversion: '65', // Latest minor version
          },
        });

        const customers = response.data.QueryResponse.Customer || [];
        
        await nango.log(`Fetched ${customers.length} customers from position ${startPosition}`);

        // Normalize and add to results
        const normalized = customers.map(normalizeCustomer);
        allCustomers.push(...normalized);

        // Check if there are more results
        hasMore = customers.length === maxResults;
        startPosition += maxResults;

        // Safety check to prevent infinite loops
        if (startPosition > 10000) {
          await nango.log('Warning: Reached maximum pagination limit (10000 records)');
          break;
        }
      }

      await nango.log(`Successfully fetched and normalized ${allCustomers.length} total customers`);

      return allCustomers;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await nango.log(`Error fetching customers: ${errorMessage}`, { level: 'error' });
      throw new Error(`Failed to fetch QuickBooks customers: ${errorMessage}`);
    }
  },
});
