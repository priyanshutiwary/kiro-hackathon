/**
 * QuickBooks Provider
 * 
 * Nango-based provider for QuickBooks Online integration.
 * Extends NangoProviderBase to inherit common Nango functionality.
 * 
 * This provider handles:
 * - Customer data fetching from QuickBooks
 * - Invoice data fetching from QuickBooks
 * - Connection management via Nango
 * 
 * @example
 * ```typescript
 * const provider = new QuickBooksProvider();
 * const customers = await provider.getCustomers(userId);
 * const invoices = await provider.getInvoices(userId);
 * ```
 */

import { NangoProviderBase } from './nango-base';

/**
 * QuickBooks Online provider implementation
 * 
 * Uses Nango actions defined in nango-integrations/quickbooks/actions/
 * - fetch-customers.ts
 * - fetch-invoices.ts
 */
export class QuickBooksProvider extends NangoProviderBase {
  /**
   * Provider name matching the agentIntegrations.provider column
   */
  readonly providerName = 'quickbooks';

  /**
   * Nango integration ID configured in Nango dashboard
   * Must match the providerConfigKey in Nango
   */
  readonly integrationId = 'quickbooks';
}
