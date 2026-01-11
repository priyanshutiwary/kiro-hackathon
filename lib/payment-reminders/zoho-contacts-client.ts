/**
 * Zoho Contacts API Client
 * Handles fetching customer/contact data from Zoho Books Contacts API
 * Supports pagination and incremental sync using last_modified_time
 */

import { ZohoTokenManager, createZohoTokenManager } from "../zoho-token-manager";
import { ZohoOAuthService, createZohoOAuthService } from "../zoho-oauth";

/**
 * Contact person within a Zoho contact
 */
export interface ZohoContactPerson {
  contact_person_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  is_primary_contact: boolean;
}

/**
 * Zoho Contact (Customer) from API
 */
export interface ZohoContact {
  contact_id: string;
  contact_name: string;
  company_name: string;
  contact_type: string;
  customer_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contact_persons: ZohoContactPerson[];
  last_modified_time: string;
  created_time: string;
}

/**
 * Response from Zoho Contacts API
 */
export interface ZohoContactsResponse {
  contacts: ZohoContact[];
  page_context: {
    page: number;
    per_page: number;
    has_more_page: boolean;
    applied_filter?: string;
    sort_column?: string;
    sort_order?: string;
  };
}

/**
 * Paginated contacts response
 */
export interface ContactsResponse {
  contacts: ZohoContact[];
  pageContext: {
    page: number;
    perPage: number;
    hasMorePage: boolean;
  };
}

/**
 * API error response from Zoho
 */
interface ZohoAPIErrorResponse {
  code: number;
  message: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Zoho Contacts API Client
 * Fetches customer data from Zoho Books Contacts API
 */
export class ZohoContactsClient {
  private tokenManager: ZohoTokenManager;
  private oauthService: ZohoOAuthService;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private static refreshLocks: Map<string, Promise<void>> = new Map();

  constructor(
    tokenManager?: ZohoTokenManager,
    oauthService?: ZohoOAuthService
  ) {
    this.tokenManager = tokenManager || createZohoTokenManager();
    this.oauthService = oauthService || createZohoOAuthService();
  }

  /**
   * Fetch contacts with pagination and optional incremental sync
   * @param userId - User ID
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 200, max: 200)
   * @param lastModifiedTime - Optional ISO timestamp for incremental sync
   * @returns Contacts response with pagination info
   */
  async getContacts(
    userId: string,
    page: number = 1,
    perPage: number = 200,
    lastModifiedTime?: string
  ): Promise<ContactsResponse> {
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

      // Build query parameters
      const params = new URLSearchParams({
        organization_id: organizationId,
        page: page.toString(),
        per_page: Math.min(perPage, 200).toString(), // Zoho max is 200
      });

      // Add incremental sync filter if provided
      if (lastModifiedTime) {
        // Convert ISO timestamp to Zoho format: YYYY-MM-DDTHH:MM:SS±HHMM
        const zohoFormattedTime = this.formatTimestampForZoho(lastModifiedTime);
        params.append("last_modified_time", zohoFormattedTime);
      }

      // Make API request with automatic token refresh
      const endpoint = `/books/v3/contacts?${params.toString()}`;
      const response = await this.makeRequest<ZohoContactsResponse>(
        userId,
        endpoint
      );

      return {
        contacts: response.contacts || [],
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
   * Get single contact by ID
   * @param userId - User ID
   * @param contactId - Zoho Contact ID
   * @returns Contact details
   */
  async getContactById(userId: string, contactId: string): Promise<ZohoContact> {
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
      const endpoint = `/books/v3/contacts/${contactId}?organization_id=${organizationId}`;
      const response = await this.makeRequest<{ contact: ZohoContact }>(
        userId,
        endpoint
      );

      if (!response.contact) {
        throw new Error(`Contact not found: ${contactId}`);
      }

      return response.contact;
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
        console.log(`[ZohoContactsClient] Token expired, refreshing...`);
        await this.refreshTokens(userId);
        // Get updated integration after refresh
        const updatedIntegration = await this.tokenManager.getIntegration(userId);
        if (!updatedIntegration) {
          throw new Error("Failed to retrieve integration after token refresh");
        }
        integration.accessToken = updatedIntegration.accessToken;
        console.log(`[ZohoContactsClient] Token refreshed successfully`);
      }

      // Build full URL using API domain from config
      const apiDomain = integration.config.apiDomain || "https://www.zohoapis.com";
      const url = `${apiDomain}${endpoint}`;
      
      console.log(`[ZohoContactsClient] Making request to: ${url}`);
      console.log(`[ZohoContactsClient] Using access token: ${integration.accessToken.substring(0, 20)}...`);

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
          console.log(`[ZohoContactsClient] Rate limited. Retrying in ${delay}ms...`);
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
          console.log(`[ZohoContactsClient] Service unavailable. Retrying in ${delay}ms...`);
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
        console.log(`[ZohoContactsClient] 401 error, retry count: ${retryCount}`);
        // Try to refresh token once
        if (retryCount === 0) {
          console.log(`[ZohoContactsClient] Attempting token refresh...`);
          await this.refreshTokens(userId);
          return this.makeRequest<T>(userId, endpoint, options, 1);
        } else {
          console.error(`[ZohoContactsClient] Token refresh failed, authentication error persists`);
          throw new Error(
            "Authentication failed. Please reconnect your Zoho Books account."
          );
        }
      }

      // Handle not found errors
      if (response.status === 404) {
        throw new Error("Contact not found or has been deleted.");
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
   * Refresh access token using refresh token with locking to prevent concurrent refreshes
   * @param userId - User ID
   */
  private async refreshTokens(userId: string): Promise<void> {
    // Check if there's already a refresh in progress for this user
    const existingLock = ZohoContactsClient.refreshLocks.get(userId);
    if (existingLock) {
      console.log(`[ZohoContactsClient] Token refresh already in progress for user ${userId}, waiting...`);
      await existingLock;
      return;
    }

    // Create a new refresh promise
    const refreshPromise = this.performTokenRefresh(userId);
    ZohoContactsClient.refreshLocks.set(userId, refreshPromise);

    try {
      await refreshPromise;
    } finally {
      // Clean up the lock
      ZohoContactsClient.refreshLocks.delete(userId);
    }
  }

  /**
   * Perform the actual token refresh
   * @param userId - User ID
   */
  private async performTokenRefresh(userId: string): Promise<void> {
    try {
      const integration = await this.tokenManager.getIntegration(userId);
      if (!integration) {
        throw new Error("Integration not found");
      }

      console.log(`[ZohoContactsClient] Refreshing tokens for user ${userId}...`);

      // Refresh tokens using OAuth service
      const newTokens = await this.oauthService.refreshAccessToken(
        integration.refreshToken,
        integration.config.accountsServer
      );

      console.log(`[ZohoContactsClient] Token refresh successful, updating database...`);

      // Update tokens in database
      await this.tokenManager.updateTokens(userId, newTokens);
      
      console.log(`[ZohoContactsClient] Tokens updated successfully in database`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ZohoContactsClient] Token refresh failed:`, errorMessage);
      
      // Only mark as error if it's a permanent auth failure
      // Don't mark as error for temporary network issues or rate limits
      if (
        errorMessage.includes("invalid_client") ||
        errorMessage.includes("invalid_grant") ||
        errorMessage.includes("unauthorized")
      ) {
        console.error(`[ZohoContactsClient] Permanent auth failure detected, marking integration as error`);
        await this.tokenManager.updateStatus(
          userId,
          "error",
          "Failed to refresh access token. Please reconnect your account."
        );
      } else {
        console.warn(`[ZohoContactsClient] Temporary refresh failure, not marking as error`);
      }
      
      throw new Error(
        "Failed to refresh access token. Please reconnect your Zoho Books account."
      );
    }
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

  /**
   * Format ISO timestamp to Zoho API format
   * Converts from ISO 8601 (2026-01-10T19:58:31.253Z) to Zoho format (2026-01-10T19:58:31+0000)
   * @param isoTimestamp - ISO 8601 timestamp string
   * @returns Zoho-formatted timestamp string
   */
  private formatTimestampForZoho(isoTimestamp: string): string {
    try {
      const date = new Date(isoTimestamp);
      
      // Get timezone offset in minutes
      const timezoneOffset = -date.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? '+' : '-';
      
      // Format: YYYY-MM-DDTHH:MM:SS±HHMM
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const offset = `${offsetSign}${String(offsetHours).padStart(2, '0')}${String(offsetMinutes).padStart(2, '0')}`;
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
    } catch (error) {
      console.error(`[ZohoContactsClient] Failed to format timestamp: ${isoTimestamp}`, error);
      // Return original if formatting fails
      return isoTimestamp;
    }
  }
}

/**
 * Create a default instance of ZohoContactsClient
 */
export function createZohoContactsClient(): ZohoContactsClient {
  return new ZohoContactsClient();
}
