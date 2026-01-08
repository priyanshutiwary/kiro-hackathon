/**
 * Zoho API Client
 * Handles API requests to Zoho Books with automatic token refresh
 * Supports Multi-DC, pagination, and rate limiting
 */

import { ZohoTokenManager, createZohoTokenManager } from "./zoho-token-manager";
import { ZohoOAuthService, createZohoOAuthService } from "./zoho-oauth";

export interface ZohoBill {
  billId: string;
  vendorId: string;
  vendorName: string;
  billNumber: string;
  referenceNumber: string;
  date: string;
  dueDate: string;
  status: "open" | "paid" | "void" | "overdue";
  total: number;
  balance: number;
  currencyCode: string;
  currencySymbol: string;
}

export interface ZohoInvoice {
  invoiceId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  referenceNumber: string;
  date: string;
  dueDate: string;
  status: "sent" | "draft" | "paid" | "void" | "overdue" | "partially_paid";
  total: number;
  balance: number;
  currencyCode: string;
  currencySymbol: string;
}

export interface BillsResponse {
  bills: ZohoBill[];
  pageContext: {
    page: number;
    perPage: number;
    hasMorePage: boolean;
    totalPages?: number;
  };
}

export interface InvoicesResponse {
  invoices: ZohoInvoice[];
  pageContext: {
    page: number;
    perPage: number;
    hasMorePage: boolean;
    totalPages?: number;
  };
}

export interface ZohoAPIBillResponse {
  bill_id: string;
  vendor_id: string;
  vendor_name: string;
  bill_number: string;
  reference_number: string;
  date: string;
  due_date: string;
  status: string;
  total: number;
  balance: number;
  currency_code: string;
  currency_symbol: string;
}

export interface ZohoAPIInvoiceResponse {
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  reference_number: string;
  date: string;
  due_date: string;
  status: string;
  total: number;
  balance: number;
  currency_code: string;
  currency_symbol: string;
}

export interface ZohoAPIBillsResponse {
  code: number;
  message: string;
  bills: ZohoAPIBillResponse[];
  page_context?: {
    page: number;
    per_page: number;
    has_more_page: boolean;
    applied_filter?: string;
    sort_column?: string;
    sort_order?: string;
  };
}

export interface ZohoAPIInvoicesResponse {
  code: number;
  message: string;
  invoices: ZohoAPIInvoiceResponse[];
  page_context?: {
    page: number;
    per_page: number;
    has_more_page: boolean;
    applied_filter?: string;
    sort_column?: string;
    sort_order?: string;
  };
}

export interface ZohoAPIErrorResponse {
  code: number;
  message: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Zoho API Client for making authenticated requests
 */
export class ZohoAPIClient {
  private tokenManager: ZohoTokenManager;
  private oauthService: ZohoOAuthService;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(
    tokenManager?: ZohoTokenManager,
    oauthService?: ZohoOAuthService
  ) {
    this.tokenManager = tokenManager || createZohoTokenManager();
    this.oauthService = oauthService || createZohoOAuthService();
  }

  /**
   * Fetch bills with pagination support
   * @param userId - User ID
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 200)
   * @returns Bills response with pagination info
   */
  async getBills(
    userId: string,
    page: number = 1,
    perPage: number = 200
  ): Promise<BillsResponse> {
    try {
      // Get integration to retrieve organization ID
      const integration = await this.tokenManager.getIntegration(userId);
      if (!integration) {
        throw new Error("Zoho integration not found. Please connect your account.");
      }

      const organizationId = integration.config.organizationId;
      if (!organizationId) {
        throw new Error("Organization ID not found in integration config.");
      }

      // Make API request with automatic token refresh
      const endpoint = `/books/v3/bills?organization_id=${organizationId}&page=${page}&per_page=${perPage}`;
      const response = await this.makeRequest<ZohoAPIBillsResponse>(
        userId,
        endpoint
      );

      // Map API response to internal format
      const bills = response.bills.map((bill) => this.mapBillResponse(bill));

      // Update last sync timestamp
      await this.tokenManager.updateLastSync(userId);

      return {
        bills,
        pageContext: {
          page: response.page_context?.page || page,
          perPage: response.page_context?.per_page || perPage,
          hasMorePage: response.page_context?.has_more_page || false,
        },
      };
    } catch (error) {
      // Update integration status if error
      await this.handleAPIError(userId, error);
      throw error;
    }
  }

  /**
   * Get single bill details
   * @param userId - User ID
   * @param billId - Bill ID
   * @returns Bill details
   */
  async getBill(userId: string, billId: string): Promise<ZohoBill> {
    try {
      // Get integration to retrieve organization ID
      const integration = await this.tokenManager.getIntegration(userId);
      if (!integration) {
        throw new Error("Zoho integration not found. Please connect your account.");
      }

      const organizationId = integration.config.organizationId;
      if (!organizationId) {
        throw new Error("Organization ID not found in integration config.");
      }

      // Make API request
      const endpoint = `/books/v3/bills/${billId}?organization_id=${organizationId}`;
      const response = await this.makeRequest<{ bill: ZohoAPIBillResponse }>(
        userId,
        endpoint
      );

      return this.mapBillResponse(response.bill);
    } catch (error) {
      await this.handleAPIError(userId, error);
      throw error;
    }
  }

  /**
   * Fetch invoices with pagination support
   * @param userId - User ID
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 200)
   * @returns Invoices response with pagination info
   */
  async getInvoices(
    userId: string,
    page: number = 1,
    perPage: number = 200
  ): Promise<InvoicesResponse> {
    try {
      // Get integration to retrieve organization ID
      const integration = await this.tokenManager.getIntegration(userId);
      if (!integration) {
        throw new Error("Zoho integration not found. Please connect your account.");
      }

      const organizationId = integration.config.organizationId;
      if (!organizationId) {
        throw new Error("Organization ID not found in integration config.");
      }

      // Make API request with automatic token refresh
      const endpoint = `/books/v3/invoices?organization_id=${organizationId}&page=${page}&per_page=${perPage}`;
      const response = await this.makeRequest<ZohoAPIInvoicesResponse>(
        userId,
        endpoint
      );

      // Map API response to internal format
      const invoices = response.invoices.map((invoice) => this.mapInvoiceResponse(invoice));

      // Update last sync timestamp
      await this.tokenManager.updateLastSync(userId);

      return {
        invoices,
        pageContext: {
          page: response.page_context?.page || page,
          perPage: response.page_context?.per_page || perPage,
          hasMorePage: response.page_context?.has_more_page || false,
        },
      };
    } catch (error) {
      // Update integration status if error
      await this.handleAPIError(userId, error);
      throw error;
    }
  }

  /**
   * Get single invoice details
   * @param userId - User ID
   * @param invoiceId - Invoice ID
   * @returns Invoice details
   */
  async getInvoice(userId: string, invoiceId: string): Promise<ZohoInvoice> {
    try {
      // Get integration to retrieve organization ID
      const integration = await this.tokenManager.getIntegration(userId);
      if (!integration) {
        throw new Error("Zoho integration not found. Please connect your account.");
      }

      const organizationId = integration.config.organizationId;
      if (!organizationId) {
        throw new Error("Organization ID not found in integration config.");
      }

      // Make API request
      const endpoint = `/books/v3/invoices/${invoiceId}?organization_id=${organizationId}`;
      const response = await this.makeRequest<{ invoice: ZohoAPIInvoiceResponse }>(
        userId,
        endpoint
      );

      return this.mapInvoiceResponse(response.invoice);
    } catch (error) {
      await this.handleAPIError(userId, error);
      throw error;
    }
  }

  /**
   * Make authenticated API request with automatic token refresh
   * @param userId - User ID
   * @param endpoint - API endpoint (relative path)
   * @param options - Fetch options
   * @param retryCount - Current retry attempt
   * @returns API response
   */
  private async makeRequest<T>(
    userId: string,
    endpoint: string,
    options?: RequestInit,
    retryCount: number = 0
  ): Promise<T> {
    try {
      // Get integration with tokens
      const integration = await this.tokenManager.getIntegration(userId);
      if (!integration) {
        throw new Error("Integration not found");
      }

      // Check if token is expired and refresh if needed
      if (this.oauthService.isTokenExpired(integration.accessTokenExpiresAt)) {
        await this.refreshTokens(userId);
        // Get updated integration after refresh
        const updatedIntegration = await this.tokenManager.getIntegration(userId);
        if (!updatedIntegration) {
          throw new Error("Failed to retrieve integration after token refresh");
        }
        integration.accessToken = updatedIntegration.accessToken;
      }

      // Build full URL using API domain from config
      const apiDomain = integration.config.apiDomain || "https://www.zohoapis.com";
      const url = `${apiDomain}${endpoint}`;

      // Make request
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Zoho-oauthtoken ${integration.accessToken}`,
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (retryCount < this.MAX_RETRIES) {
          const delay = this.calculateBackoffDelay(retryCount);
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await this.sleep(delay);
          return this.makeRequest<T>(userId, endpoint, options, retryCount + 1);
        } else {
          throw new Error(
            "Rate limit exceeded. Please try again later."
          );
        }
      }

      // Handle service unavailable with retry
      if (response.status === 503) {
        if (retryCount < this.MAX_RETRIES) {
          const delay = this.calculateBackoffDelay(retryCount);
          console.log(`Service unavailable. Retrying in ${delay}ms...`);
          await this.sleep(delay);
          return this.makeRequest<T>(userId, endpoint, options, retryCount + 1);
        } else {
          throw new Error(
            "Zoho Books service is temporarily unavailable. Please try again later."
          );
        }
      }

      // Handle authentication errors
      if (response.status === 401) {
        // Try to refresh token once
        if (retryCount === 0) {
          await this.refreshTokens(userId);
          return this.makeRequest<T>(userId, endpoint, options, 1);
        } else {
          throw new Error(
            "Authentication failed. Please reconnect your Zoho Books account."
          );
        }
      }

      // Handle other errors
      if (!response.ok) {
        const errorData: ZohoAPIErrorResponse = await response.json().catch(() => ({
          code: response.status,
          message: response.statusText,
        }));

        throw new Error(
          errorData.message || `API request failed: ${response.status} ${response.statusText}`
        );
      }

      // Parse and return response
      const data: T = await response.json();
      return data;
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`API request failed: ${String(error)}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param userId - User ID
   */
  private async refreshTokens(userId: string): Promise<void> {
    try {
      const integration = await this.tokenManager.getIntegration(userId);
      if (!integration) {
        throw new Error("Integration not found");
      }

      // Refresh tokens using OAuth service
      const newTokens = await this.oauthService.refreshAccessToken(
        integration.refreshToken,
        integration.config.accountsServer
      );

      // Update tokens in database
      await this.tokenManager.updateTokens(userId, newTokens);
    } catch (error) {
      // Mark integration as error state
      await this.tokenManager.updateStatus(
        userId,
        "error",
        "Failed to refresh access token. Please reconnect your account."
      );
      throw new Error(
        "Failed to refresh access token. Please reconnect your Zoho Books account."
      );
    }
  }

  /**
   * Map Zoho API bill response to internal format
   * @param bill - API bill response
   * @returns Mapped bill
   */
  private mapBillResponse(bill: ZohoAPIBillResponse): ZohoBill {
    // Determine status (Zoho uses lowercase, we normalize)
    let status: "open" | "paid" | "void" | "overdue" = "open";
    const billStatus = bill.status.toLowerCase();
    
    if (billStatus === "paid") {
      status = "paid";
    } else if (billStatus === "void") {
      status = "void";
    } else if (billStatus === "overdue") {
      status = "overdue";
    } else if (billStatus === "open") {
      status = "open";
    }

    return {
      billId: bill.bill_id,
      vendorId: bill.vendor_id,
      vendorName: bill.vendor_name,
      billNumber: bill.bill_number,
      referenceNumber: bill.reference_number || "",
      date: bill.date,
      dueDate: bill.due_date,
      status,
      total: bill.total,
      balance: bill.balance,
      currencyCode: bill.currency_code,
      currencySymbol: bill.currency_symbol,
    };
  }

  /**
   * Map Zoho API invoice response to internal format
   * @param invoice - API invoice response
   * @returns Mapped invoice
   */
  private mapInvoiceResponse(invoice: ZohoAPIInvoiceResponse): ZohoInvoice {
    // Determine status (Zoho uses lowercase, we normalize)
    let status: "sent" | "draft" | "paid" | "void" | "overdue" | "partially_paid" = "draft";
    const invoiceStatus = invoice.status.toLowerCase();
    
    if (invoiceStatus === "sent") {
      status = "sent";
    } else if (invoiceStatus === "draft") {
      status = "draft";
    } else if (invoiceStatus === "paid") {
      status = "paid";
    } else if (invoiceStatus === "void") {
      status = "void";
    } else if (invoiceStatus === "overdue") {
      status = "overdue";
    } else if (invoiceStatus === "partially_paid" || invoiceStatus === "partiallypaid") {
      status = "partially_paid";
    }

    return {
      invoiceId: invoice.invoice_id,
      customerId: invoice.customer_id,
      customerName: invoice.customer_name,
      invoiceNumber: invoice.invoice_number,
      referenceNumber: invoice.reference_number || "",
      date: invoice.date,
      dueDate: invoice.due_date,
      status,
      total: invoice.total,
      balance: invoice.balance,
      currencyCode: invoice.currency_code,
      currencySymbol: invoice.currency_symbol,
    };
  }

  /**
   * Handle API errors and update integration status
   * @param userId - User ID
   * @param error - Error object
   */
  private async handleAPIError(userId: string, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Determine if this is a critical error that requires user action
    if (
      errorMessage.includes("Authentication failed") ||
      errorMessage.includes("reconnect") ||
      errorMessage.includes("refresh")
    ) {
      await this.tokenManager.updateStatus(userId, "error", errorMessage);
    }
  }

  /**
   * Calculate exponential backoff delay
   * @param retryCount - Current retry attempt
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a default instance of ZohoAPIClient
 */
export function createZohoAPIClient(): ZohoAPIClient {
  return new ZohoAPIClient();
}
