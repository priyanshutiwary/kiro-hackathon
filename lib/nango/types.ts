/**
 * TypeScript types for Nango SDK and integration operations
 */

/**
 * Nango connection status
 */
export type NangoConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

/**
 * Nango connection metadata
 */
export interface NangoConnection {
  id: string;
  connectionId: string;
  providerConfigKey: string;
  provider: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Nango action trigger options
 */
export interface NangoActionTriggerOptions {
  connectionId: string;
  providerConfigKey: string;
  action: string;
  input?: Record<string, any>;
}

/**
 * Nango action result
 */
export interface NangoActionResult<T = any> {
  data: T;
  metadata?: {
    executionTime?: number;
    timestamp?: string;
  };
}

/**
 * Nango session token response
 */
export interface NangoSessionToken {
  sessionToken: string;
  expiresAt?: string;
}

/**
 * Nango webhook event types
 */
export type NangoWebhookEventType = 
  | 'auth'
  | 'sync'
  | 'forward';

/**
 * Nango webhook operation types
 */
export type NangoWebhookOperation = 
  | 'creation'
  | 'override'
  | 'refresh';

/**
 * Nango webhook payload for auth events
 */
export interface NangoAuthWebhookPayload {
  type: 'auth';
  operation: NangoWebhookOperation;
  connectionId: string;
  authMode: string;
  providerConfigKey: string;
  provider: string;
  environment: string;
  success: boolean;
  tags?: {
    end_user_id?: string;
    end_user_email?: string;
    end_user_display_name?: string;
    organization_id?: string;
    [key: string]: string | undefined;
  };
  error?: {
    type: string;
    description: string;
  };
}

/**
 * Nango webhook payload for sync events
 */
export interface NangoSyncWebhookPayload {
  type: 'sync';
  connectionId: string;
  providerConfigKey: string;
  syncName: string;
  model: string;
  syncType?: 'INCREMENTAL' | 'INITIAL' | 'WEBHOOK';
  success: boolean;
  modifiedAfter?: string;
  responseResults?: {
    added: number;
    updated: number;
    deleted: number;
  };
  error?: {
    type: string;
    description: string;
  };
  startedAt?: string;
  failedAt?: string;
}

/**
 * Nango webhook payload (union type)
 */
export type NangoWebhookPayload = NangoAuthWebhookPayload | NangoSyncWebhookPayload;

/**
 * Nango error response
 */
export interface NangoError {
  message: string;
  code?: string;
  type?: 'auth_error' | 'api_error' | 'rate_limit_error' | 'network_error';
  retryable?: boolean;
}

/**
 * Nango provider configuration
 */
export interface NangoProviderConfig {
  providerConfigKey: string;
  provider: string;
  displayName: string;
  description?: string;
  authMode: 'OAUTH2' | 'OAUTH1' | 'API_KEY' | 'BASIC';
  scopes?: string[];
}

/**
 * Nango OAuth connection options
 */
export interface NangoOAuthOptions {
  providerConfigKey: string;
  connectionId: string;
  params?: Record<string, string>;
  onEvent?: (event: NangoOAuthEvent) => void;
}

/**
 * Nango OAuth event
 */
export interface NangoOAuthEvent {
  type: 'connect' | 'error' | 'close';
  error?: string;
  connectionId?: string;
}

/**
 * Normalized customer data from any provider
 */
export interface NormalizedCustomer {
  externalId: string;
  customerName: string;
  companyName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  contactPersons?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
}

/**
 * Normalized invoice data from any provider
 */
export interface NormalizedInvoice {
  externalId: string;
  externalCustomerId: string;
  invoiceNumber: string;
  amountTotal: number;
  amountDue: number;
  currencyCode: string;
  dueDate: Date;
  status: 'paid' | 'unpaid' | 'overdue';
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

/**
 * Nango action input for fetching invoices
 */
export interface FetchInvoicesInput {
  startDate?: string;
  endDate?: string;
  status?: 'paid' | 'unpaid' | 'overdue' | 'all';
  limit?: number;
}

/**
 * Nango action input for fetching customers
 */
export interface FetchCustomersInput {
  limit?: number;
  offset?: number;
}

/**
 * Provider-specific metadata
 */
export interface ProviderMetadata {
  provider: string;
  connectionId: string;
  lastSyncAt?: Date;
  syncStatus?: 'success' | 'error' | 'pending';
  errorMessage?: string;
  customFields?: Record<string, any>;
}
