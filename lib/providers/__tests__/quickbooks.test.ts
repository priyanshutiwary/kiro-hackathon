import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuickBooksProvider } from '../quickbooks';
import type { NormalizedCustomer, NormalizedInvoice } from '../types';

// Mock the Nango client
vi.mock('@/lib/nango/client', () => ({
  getNangoClient: vi.fn(() => ({
    triggerAction: vi.fn(),
    getConnection: vi.fn(),
  })),
  getConnectionId: vi.fn((userId: string, provider: string) => `${userId}_${provider}`),
}));

describe('QuickBooksProvider', () => {
  let provider: QuickBooksProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new QuickBooksProvider();
  });

  describe('Provider Instantiation', () => {
    it('should create a QuickBooks provider instance', () => {
      expect(provider).toBeInstanceOf(QuickBooksProvider);
    });

    it('should have correct providerName', () => {
      expect(provider.providerName).toBe('quickbooks');
    });

    it('should have correct integrationId', () => {
      expect(provider.integrationId).toBe('quickbooks');
    });

    it('should have integrationId matching providerName', () => {
      // For QuickBooks, these should match
      expect(provider.integrationId).toBe(provider.providerName);
    });
  });

  describe('Provider Properties', () => {
    it('should have readonly providerName', () => {
      // TypeScript enforces readonly at compile time
      // This test verifies the property exists and has the correct value
      const providerName = provider.providerName;
      expect(providerName).toBe('quickbooks');
      expect(typeof providerName).toBe('string');
    });

    it('should have readonly integrationId', () => {
      const integrationId = provider.integrationId;
      expect(integrationId).toBe('quickbooks');
      expect(typeof integrationId).toBe('string');
    });
  });

  describe('Provider Interface Compliance', () => {
    it('should implement getCustomers method', () => {
      expect(provider.getCustomers).toBeDefined();
      expect(typeof provider.getCustomers).toBe('function');
    });

    it('should implement getInvoices method', () => {
      expect(provider.getInvoices).toBeDefined();
      expect(typeof provider.getInvoices).toBe('function');
    });

    it('should implement checkConnection method', () => {
      expect(provider.checkConnection).toBeDefined();
      expect(typeof provider.checkConnection).toBe('function');
    });
  });

  describe('Type Safety', () => {
    it('should return Promise<NormalizedCustomer[]> from getCustomers', async () => {
      // This test verifies the return type at runtime
      const mockCustomers: NormalizedCustomer[] = [
        {
          externalId: 'qb-123',
          customerName: 'Test Customer',
          primaryEmail: 'test@example.com',
        },
      ];

      // Mock the triggerAction to return customers
      const mockNango = provider['nango'] as any;
      mockNango.triggerAction = vi.fn().mockResolvedValue(mockCustomers);

      const result = await provider.getCustomers('user-123');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockCustomers);
    });

    it('should return Promise<NormalizedInvoice[]> from getInvoices', async () => {
      const mockInvoices: NormalizedInvoice[] = [
        {
          externalId: 'inv-123',
          externalCustomerId: 'qb-123',
          invoiceNumber: 'INV-001',
          amountDue: '1000.00',
          currencyCode: 'USD',
          dueDate: new Date('2024-12-31'),
        },
      ];

      const mockNango = provider['nango'] as any;
      mockNango.triggerAction = vi.fn().mockResolvedValue(mockInvoices);

      const result = await provider.getInvoices('user-123');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockInvoices);
    });

    it('should return Promise<boolean> from checkConnection', async () => {
      const mockNango = provider['nango'] as any;
      mockNango.getConnection = vi.fn().mockResolvedValue({ id: 'conn-123' });

      const result = await provider.checkConnection('user-123');
      expect(typeof result).toBe('boolean');
    });
  });
});
