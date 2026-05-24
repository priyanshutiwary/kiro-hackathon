import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QuickBooksProvider } from '../quickbooks';
import { NangoProviderError } from '../nango-base';
import type { NormalizedCustomer, NormalizedInvoice } from '../types';

// Mock the Nango client module - must be hoisted
vi.mock('@/lib/nango/client', () => {
  const mockTriggerAction = vi.fn();
  const mockGetConnection = vi.fn();
  
  return {
    getNangoClient: vi.fn(() => ({
      triggerAction: mockTriggerAction,
      getConnection: mockGetConnection,
    })),
    getConnectionId: vi.fn((userId: string, provider: string) => `${userId}_${provider}`),
    // Export mocks for test access
    __mockTriggerAction: mockTriggerAction,
    __mockGetConnection: mockGetConnection,
  };
});

describe('QuickBooksProvider Integration Tests', () => {
  let provider: QuickBooksProvider;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTriggerAction: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGetConnection: any;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get mock references
    await import('@/lib/nango/client');
    provider = new QuickBooksProvider();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTriggerAction = (provider as any).nango.triggerAction;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetConnection = (provider as any).nango.getConnection;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCustomers Integration', () => {
    it('should successfully fetch customers from QuickBooks', async () => {
      const mockCustomers: NormalizedCustomer[] = [
        {
          externalId: 'qb-cust-1',
          customerName: 'Acme Corporation',
          companyName: 'Acme Corp',
          primaryEmail: 'billing@acme.com',
          primaryPhone: '+1-555-0100',
        },
        {
          externalId: 'qb-cust-2',
          customerName: 'Tech Solutions Inc',
          companyName: 'Tech Solutions',
          primaryEmail: 'accounts@techsolutions.com',
          primaryPhone: '+1-555-0200',
        },
      ];

      mockTriggerAction.mockResolvedValue(mockCustomers);

      const result = await provider.getCustomers(testUserId);

      expect(mockTriggerAction).toHaveBeenCalledWith(
        'quickbooks',
        'test-user-123_quickbooks',
        'fetch-customers',
        {}
      );
      expect(result).toEqual(mockCustomers);
      expect(result).toHaveLength(2);
    });

    it('should handle empty customer list', async () => {
      mockTriggerAction.mockResolvedValue([]);

      const result = await provider.getCustomers(testUserId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw NangoProviderError on fetch failure', async () => {
      mockTriggerAction.mockRejectedValue(new Error('QuickBooks API error'));

      await expect(provider.getCustomers(testUserId)).rejects.toThrow(NangoProviderError);
      await expect(provider.getCustomers(testUserId)).rejects.toThrow(
        /Failed to fetch customers from quickbooks/
      );
    });

    it('should mark network errors as retryable', async () => {
      mockTriggerAction.mockRejectedValue(new Error('Network timeout'));

      try {
        await provider.getCustomers(testUserId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NangoProviderError);
        if (error instanceof NangoProviderError) {
          expect(error.retryable).toBe(true);
          expect(error.provider).toBe('quickbooks');
        }
      }
    });

    it('should mark auth errors as non-retryable', async () => {
      mockTriggerAction.mockRejectedValue(new Error('Authentication failed: 401'));

      try {
        await provider.getCustomers(testUserId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NangoProviderError);
        if (error instanceof NangoProviderError) {
          expect(error.retryable).toBe(false);
          expect(error.provider).toBe('quickbooks');
        }
      }
    });
  });

  describe('getInvoices Integration', () => {
    it('should successfully fetch invoices from QuickBooks', async () => {
      const mockInvoices: NormalizedInvoice[] = [
        {
          externalId: 'qb-inv-1',
          externalCustomerId: 'qb-cust-1',
          customerName: 'Acme Corporation',
          invoiceNumber: 'INV-1001',
          amountTotal: '5000.00',
          amountDue: '5000.00',
          currencyCode: 'USD',
          dueDate: new Date('2024-12-31'),
          status: 'Unpaid',
        },
        {
          externalId: 'qb-inv-2',
          externalCustomerId: 'qb-cust-2',
          customerName: 'Tech Solutions Inc',
          invoiceNumber: 'INV-1002',
          amountTotal: '3500.00',
          amountDue: '1500.00',
          currencyCode: 'USD',
          dueDate: new Date('2024-11-30'),
          status: 'PartiallyPaid',
        },
      ];

      mockTriggerAction.mockResolvedValue(mockInvoices);

      const result = await provider.getInvoices(testUserId);

      expect(mockTriggerAction).toHaveBeenCalledWith(
        'quickbooks',
        'test-user-123_quickbooks',
        'fetch-invoices',
        {}
      );
      expect(result).toEqual(mockInvoices);
      expect(result).toHaveLength(2);
    });

    it('should fetch invoices with startDate filter', async () => {
      const startDate = new Date('2024-01-01');
      const mockInvoices: NormalizedInvoice[] = [
        {
          externalId: 'qb-inv-3',
          externalCustomerId: 'qb-cust-1',
          invoiceNumber: 'INV-1003',
          amountDue: '2000.00',
          currencyCode: 'USD',
          dueDate: new Date('2024-06-30'),
        },
      ];

      mockTriggerAction.mockResolvedValue(mockInvoices);

      const result = await provider.getInvoices(testUserId, startDate);

      expect(mockTriggerAction).toHaveBeenCalledWith(
        'quickbooks',
        'test-user-123_quickbooks',
        'fetch-invoices',
        { startDate: startDate.toISOString() }
      );
      expect(result).toEqual(mockInvoices);
    });

    it('should handle empty invoice list', async () => {
      mockTriggerAction.mockResolvedValue([]);

      const result = await provider.getInvoices(testUserId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw NangoProviderError on fetch failure', async () => {
      mockTriggerAction.mockRejectedValue(new Error('QuickBooks API error'));

      await expect(provider.getInvoices(testUserId)).rejects.toThrow(NangoProviderError);
      await expect(provider.getInvoices(testUserId)).rejects.toThrow(
        /Failed to fetch invoices from quickbooks/
      );
    });

    it('should handle rate limit errors as retryable', async () => {
      mockTriggerAction.mockRejectedValue(new Error('Rate limit exceeded: 429'));

      try {
        await provider.getInvoices(testUserId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NangoProviderError);
        if (error instanceof NangoProviderError) {
          expect(error.retryable).toBe(true);
          expect(error.code).toBe('FETCH_INVOICES_ERROR');
        }
      }
    });
  });

  describe('checkConnection Integration', () => {
    it('should return true when connection exists', async () => {
      mockGetConnection.mockResolvedValue({
        id: 'test-user-123_quickbooks',
        provider: 'quickbooks',
        connectionId: 'test-user-123_quickbooks',
      });

      const result = await provider.checkConnection(testUserId);

      expect(mockGetConnection).toHaveBeenCalledWith(
        'quickbooks',
        'test-user-123_quickbooks'
      );
      expect(result).toBe(true);
    });

    it('should return false when connection does not exist', async () => {
      mockGetConnection.mockResolvedValue(null);

      const result = await provider.checkConnection(testUserId);

      expect(result).toBe(false);
    });

    it('should return false when connection check throws error', async () => {
      mockGetConnection.mockRejectedValue(new Error('Connection not found'));

      const result = await provider.checkConnection(testUserId);

      expect(result).toBe(false);
    });

    it('should use correct connection ID format', async () => {
      mockGetConnection.mockResolvedValue({ id: 'conn-123' });

      await provider.checkConnection(testUserId);

      await import('@/lib/nango/client');
      expect(mockGetConnection).toHaveBeenCalledWith(
        'quickbooks',
        'test-user-123_quickbooks'
      );
    });
  });

  describe('Error Handling', () => {
    it('should preserve original error in NangoProviderError', async () => {
      const originalError = new Error('Original QuickBooks error');
      mockTriggerAction.mockRejectedValue(originalError);

      try {
        await provider.getCustomers(testUserId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NangoProviderError);
        if (error instanceof NangoProviderError) {
          // The originalError is wrapped in another Error by triggerAction
          expect(error.originalError).toBeInstanceOf(Error);
          expect((error.originalError as Error).message).toContain('Original QuickBooks error');
        }
      }
    });

    it('should include provider name in error', async () => {
      mockTriggerAction.mockRejectedValue(new Error('API error'));

      try {
        await provider.getInvoices(testUserId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NangoProviderError);
        if (error instanceof NangoProviderError) {
          expect(error.provider).toBe('quickbooks');
          expect(error.message).toContain('quickbooks');
        }
      }
    });
  });

  describe('Connection ID Generation', () => {
    it('should generate correct connection ID format', async () => {
      mockGetConnection.mockResolvedValue({ id: 'conn-123' });

      await provider.checkConnection(testUserId);

      const nangoModule = await import('@/lib/nango/client');
      expect(nangoModule.getConnectionId).toHaveBeenCalledWith(testUserId, 'quickbooks');
    });

    it('should use connection ID in all Nango operations', async () => {
      mockTriggerAction.mockResolvedValue([]);

      await provider.getCustomers(testUserId);
      await provider.getInvoices(testUserId);

      // Both calls should use the same connection ID format
      expect(mockTriggerAction).toHaveBeenCalledWith(
        'quickbooks',
        'test-user-123_quickbooks',
        'fetch-customers',
        {}
      );
      expect(mockTriggerAction).toHaveBeenCalledWith(
        'quickbooks',
        'test-user-123_quickbooks',
        'fetch-invoices',
        {}
      );
    });
  });
});
