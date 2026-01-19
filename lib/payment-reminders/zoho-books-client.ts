/**
 * Zoho Books Client for Payment Reminders
 * Handles invoice fetching with filtering for payment reminder system
 */

import { ZohoAPIClient, createZohoAPIClient } from "../zoho-api-client";

/**
 * Enhanced Zoho Invoice interface for payment reminders
 * Includes all fields needed for reminder scheduling and verification
 */
export interface ZohoInvoice {
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  invoice_number: string;
  total: number;
  balance: number;
  due_date: string;
  status: string;
  last_modified_time: string;
}

/**
 * Invoice filters for querying Zoho Books API
 */
export interface InvoiceFilters {
  status?: string[];
  dueDateMin?: Date;
  dueDateMax?: Date;
  lastModifiedAfter?: Date;
  organizationId: string;
}

/**
 * Custom error types for Zoho Books operations
 */
export class ZohoBooksError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ZohoBooksError';
  }
}

export class ZohoRateLimitError extends ZohoBooksError {
  constructor(message: string = 'Rate limit exceeded', originalError?: unknown) {
    super(message, 'RATE_LIMIT_EXCEEDED', originalError);
    this.name = 'ZohoRateLimitError';
  }
}

export class ZohoAuthenticationError extends ZohoBooksError {
  constructor(message: string = 'Authentication failed', originalError?: unknown) {
    super(message, 'AUTHENTICATION_FAILED', originalError);
    this.name = 'ZohoAuthenticationError';
  }
}

export class ZohoNetworkError extends ZohoBooksError {
  constructor(message: string = 'Network error', originalError?: unknown) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'ZohoNetworkError';
  }
}

/**
 * Zoho API response for invoice details
 */
interface ZohoAPIInvoiceDetailResponse {
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  total: number;
  balance: number;
  due_date: string;
  status: string;
  last_modified_time: string;
  customer?: {
    contact_persons?: Array<{
      phone?: string;
      mobile?: string;
    }>;
  };
}

/**
 * Zoho API response for invoices list
 */
interface ZohoAPIInvoicesListResponse {
  code: number;
  message: string;
  invoices: ZohoAPIInvoiceDetailResponse[];
  page_context?: {
    page: number;
    per_page: number;
    has_more_page: boolean;
  };
}

/**
 * Zoho Books Client for Payment Reminder System
 */
export class ZohoBooksClient {
  private apiClient: ZohoAPIClient;

  constructor(apiClient?: ZohoAPIClient) {
    this.apiClient = apiClient || createZohoAPIClient();
  }

  /**
   * Fetch invoices with filtering support
   * @param userId - User ID
   * @param filters - Invoice filters
   * @returns Array of invoices matching filters
   * @throws {ZohoAuthenticationError} When authentication fails
   * @throws {ZohoRateLimitError} When rate limit is exceeded
   * @throws {ZohoNetworkError} When network errors occur
   * @throws {ZohoBooksError} For other API errors
   */
  async getInvoices(userId: string, filters: InvoiceFilters): Promise<ZohoInvoice[]> {
    const allInvoices: ZohoInvoice[] = [];
    let page = 1;
    let hasMorePages = true;
    const perPage = 200;

    try {
      while (hasMorePages) {
        // Build query parameters
        const queryParams = new URLSearchParams({
          organization_id: filters.organizationId,
          page: page.toString(),
          per_page: perPage.toString(),
        });

        // Add status filter - Note: Zoho API doesn't support multiple status values
        // We'll filter by status in memory after fetching
        // if (filters.status && filters.status.length > 0) {
        //   queryParams.append('status', filters.status.join(','));
        // }

        // Add due date filters
        if (filters.dueDateMin) {
          queryParams.append('due_date_start', this.formatDate(filters.dueDateMin));
        }
        if (filters.dueDateMax) {
          queryParams.append('due_date_end', this.formatDate(filters.dueDateMax));
        }

        // Add last modified filter for incremental sync
        if (filters.lastModifiedAfter) {
          queryParams.append('last_modified_time', this.formatDateTime(filters.lastModifiedAfter));
        }

        // Make API request using the underlying client's makeRequest method
        const endpoint = `/books/v3/invoices?${queryParams.toString()}`;
        
        // @ts-expect-error - Accessing private method for advanced filtering
        const response: ZohoAPIInvoicesListResponse = await this.apiClient.makeRequest(
          userId,
          endpoint
        );

        // Transform and add invoices to result
        const invoices = response.invoices.map((invoice: ZohoAPIInvoiceDetailResponse) => this.transformInvoice(invoice));
        allInvoices.push(...invoices);

        // Check if there are more pages
        hasMorePages = response.page_context?.has_more_page || false;
        page++;
      }

      // Filter by status in memory (Zoho API doesn't support multiple status values)
      let filteredInvoices = allInvoices;
      if (filters.status && filters.status.length > 0) {
        filteredInvoices = allInvoices.filter(invoice => 
          filters.status!.includes(invoice.status.toLowerCase())
        );
      }

      return filteredInvoices;
    } catch (error) {
      // Wrap and re-throw with appropriate error type
      return this.handleError(error, 'getInvoices');
    }
  }

  /**
   * Transform Zoho API invoice response to our interface
   * @param invoice - Zoho API invoice response
   * @returns Transformed invoice
   */
  private transformInvoice(invoice: ZohoAPIInvoiceDetailResponse): ZohoInvoice {
    // Extract phone number from customer contact persons
    let customerPhone = '';
    if (invoice.customer?.contact_persons && invoice.customer.contact_persons.length > 0) {
      const contactPerson = invoice.customer.contact_persons[0];
      customerPhone = contactPerson.mobile || contactPerson.phone || '';
    }

    return {
      invoice_id: invoice.invoice_id,
      customer_id: invoice.customer_id,
      customer_name: invoice.customer_name,
      customer_phone: customerPhone,
      invoice_number: invoice.invoice_number,
      total: invoice.total,
      balance: invoice.balance,
      due_date: invoice.due_date,
      status: invoice.status,
      last_modified_time: invoice.last_modified_time,
    };
  }

  /**
   * Format date to YYYY-MM-DD for Zoho API
   * @param date - Date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format datetime to Zoho API format (YYYY-MM-DDTHH:MM:SS±HHMM)
   * @param date - Date to format
   * @returns Formatted datetime string
   */
  private formatDateTime(date: Date): string {
    // Get timezone offset in minutes and convert to ±HHMM format
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    const timezone = `${sign}${hours}${minutes}`;
    
    // Format date and time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone}`;
  }

  /**
   * Get single invoice by ID for pre-call verification
   * @param userId - User ID
   * @param invoiceId - Zoho invoice ID
   * @param organizationId - Zoho organization ID
   * @returns Invoice details
   * @throws {ZohoAuthenticationError} When authentication fails
   * @throws {ZohoRateLimitError} When rate limit is exceeded
   * @throws {ZohoNetworkError} When network errors occur
   * @throws {ZohoBooksError} For other API errors
   */
  async getInvoiceById(userId: string, invoiceId: string, organizationId: string): Promise<ZohoInvoice> {
    const endpoint = `/books/v3/invoices/${invoiceId}?organization_id=${organizationId}`;
    
    try {
      // @ts-expect-error - Accessing private method for single invoice fetch
      const response: { invoice: ZohoAPIInvoiceDetailResponse } = await this.apiClient.makeRequest(
        userId,
        endpoint
      );

      return this.transformInvoice(response.invoice);
    } catch (error) {
      return this.handleError(error, 'getInvoiceById', { invoiceId });
    }
  }

  /**
   * Handle and categorize errors from Zoho API
   * @param error - Original error
   * @param operation - Operation that failed
   * @param context - Additional context
   * @throws Appropriate error type based on error content
   */
  private handleError(error: unknown, operation: string, context?: Record<string, unknown>): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextStr = context ? ` (${JSON.stringify(context)})` : '';

    // Categorize error based on message content
    if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
      throw new ZohoRateLimitError(
        `Rate limit exceeded during ${operation}${contextStr}`,
        error
      );
    }

    if (
      errorMessage.includes('Authentication') ||
      errorMessage.includes('reconnect') ||
      errorMessage.includes('401')
    ) {
      throw new ZohoAuthenticationError(
        `Authentication failed during ${operation}${contextStr}`,
        error
      );
    }

    if (
      errorMessage.includes('Network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('503')
    ) {
      throw new ZohoNetworkError(
        `Network error during ${operation}${contextStr}`,
        error
      );
    }

    // Generic Zoho Books error
    throw new ZohoBooksError(
      `Zoho Books API error during ${operation}: ${errorMessage}${contextStr}`,
      'API_ERROR',
      error
    );
  }
}

/**
 * Create a default instance of ZohoBooksClient
 */
export function createZohoBooksClient(): ZohoBooksClient {
  return new ZohoBooksClient();
}
