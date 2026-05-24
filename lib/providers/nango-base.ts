/**
 * NangoProviderBase Abstract Class
 * 
 * Base class for all Nango-based invoice providers. Handles common Nango operations
 * like connection management, action triggering, and error handling.
 * 
 * All Nango providers (QuickBooks, Xero, FreshBooks, etc.) extend this class
 * and only need to specify their providerName and integrationId.
 * 
 * @example
 * ```typescript
 * export class QuickBooksProvider extends NangoProviderBase {
 *   providerName = 'quickbooks';
 *   integrationId = 'quickbooks'; // Must match Nango dashboard
 * }
 * ```
 */

import { getNangoClient, getConnectionId } from '@/lib/nango/client';
import type { 
  InvoiceProvider, 
  NormalizedCustomer, 
  NormalizedInvoice 
} from './types';
import type { Nango } from '@nangohq/node';

/**
 * Custom error class for Nango provider operations
 */
export class NangoProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: string = 'NANGO_ERROR',
    public readonly retryable: boolean = false,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'NangoProviderError';
    
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NangoProviderError);
    }
  }
}

/**
 * Abstract base class for all Nango-based providers
 * 
 * Provides common functionality for:
 * - Nango SDK initialization
 * - Connection management
 * - Action triggering
 * - Error handling
 * - Connection ID generation
 */
export abstract class NangoProviderBase implements InvoiceProvider {
  /**
   * The provider name (e.g., 'quickbooks', 'xero', 'freshbooks')
   * Must match the provider column in agentIntegrations table
   */
  abstract readonly providerName: string;

  /**
   * The Nango integration ID configured in Nango dashboard
   * Must match the providerConfigKey in Nango
   */
  abstract readonly integrationId: string;

  /**
   * Nango SDK client instance
   * Initialized lazily on first use
   */
  protected nango: Nango;

  /**
   * Initialize the Nango provider
   * 
   * @throws {NangoProviderError} If NANGO_SECRET_KEY is not configured
   */
  constructor() {
    try {
      this.nango = getNangoClient();
    } catch (error) {
      throw new NangoProviderError(
        `Failed to initialize Nango client: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'nango',
        'INIT_ERROR',
        false,
        error
      );
    }
  }

  /**
   * Fetch all customers for the given user from the provider
   * 
   * Triggers the 'fetch-customers' Nango action for this provider
   * 
   * @param userId - The user's ID
   * @returns Array of normalized customers
   * @throws {NangoProviderError} If the action fails
   */
  async getCustomers(userId: string): Promise<NormalizedCustomer[]> {
    try {
      const result = await this.triggerAction<NormalizedCustomer[]>(
        userId,
        'fetch-customers',
        {}
      );

      return result;
    } catch (error) {
      throw new NangoProviderError(
        `Failed to fetch customers from ${this.providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.providerName,
        'FETCH_CUSTOMERS_ERROR',
        this.isRetryableError(error),
        error
      );
    }
  }

  /**
   * Fetch all invoices for the given user from the provider
   * 
   * Triggers the 'fetch-invoices' Nango action for this provider
   * 
   * @param userId - The user's ID
   * @param startDate - Optional start date to filter invoices
   * @returns Array of normalized invoices
   * @throws {NangoProviderError} If the action fails
   */
  async getInvoices(userId: string, startDate?: Date): Promise<NormalizedInvoice[]> {
    try {
      const input = startDate ? { startDate: startDate.toISOString() } : {};
      
      const result = await this.triggerAction<NormalizedInvoice[]>(
        userId,
        'fetch-invoices',
        input
      );

      return result;
    } catch (error) {
      throw new NangoProviderError(
        `Failed to fetch invoices from ${this.providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.providerName,
        'FETCH_INVOICES_ERROR',
        this.isRetryableError(error),
        error
      );
    }
  }

  /**
   * Trigger a Nango action for this provider
   * 
   * @param userId - The user's ID
   * @param actionName - The name of the Nango action to trigger
   * @param input - Input parameters for the action
   * @returns The action result
   * @throws {Error} If the action fails
   * 
   * @protected
   */
  protected async triggerAction<T = unknown>(
    userId: string,
    actionName: string,
    input: Record<string, unknown>
  ): Promise<T> {
    const connectionId = this.getConnectionId(userId);

    try {
      const result = await this.nango.triggerAction<Record<string, unknown>, T>(
        this.integrationId,
        connectionId,
        actionName,
        input
      );

      return result;
    } catch (error) {
      // Re-throw with more context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Nango action '${actionName}' failed for ${this.providerName}: ${errorMessage}`
      );
    }
  }

  /**
   * Generate a connection ID for the given user
   * 
   * Connection IDs follow the format: {userId}_{providerName}
   * This ensures each user can have separate connections to different providers
   * 
   * @param userId - The user's ID
   * @returns Connection ID string
   * 
   * @protected
   */
  protected getConnectionId(userId: string): string {
    return getConnectionId(userId, this.providerName);
  }

  /**
   * Check if a connection exists for the given user
   * 
   * @param userId - The user's ID
   * @returns true if connection exists and is valid, false otherwise
   */
  async checkConnection(userId: string): Promise<boolean> {
    try {
      const connectionId = this.getConnectionId(userId);
      
      const connection = await this.nango.getConnection(
        this.integrationId,
        connectionId
      );

      return connection !== null && connection !== undefined;
    } catch (error) {
      // Connection doesn't exist or error occurred
      console.error(
        `Failed to check connection for ${this.providerName} (user: ${userId}):`,
        error
      );
      return false;
    }
  }

  /**
   * Determine if an error is retryable
   * 
   * @param error - The error to check
   * @returns true if the error is retryable, false otherwise
   * 
   * @protected
   */
  protected isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    
    // Network errors are retryable
    if (message.includes('network') || message.includes('timeout')) {
      return true;
    }

    // Rate limit errors are retryable
    if (message.includes('rate limit') || message.includes('429')) {
      return true;
    }

    // Temporary server errors are retryable
    if (message.includes('503') || message.includes('502') || message.includes('504')) {
      return true;
    }

    // Auth errors are not retryable
    if (message.includes('auth') || message.includes('401') || message.includes('403')) {
      return false;
    }

    // Default to not retryable
    return false;
  }
}
