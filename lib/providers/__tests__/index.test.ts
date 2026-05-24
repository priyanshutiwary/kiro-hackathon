import { describe, it, expect, vi } from 'vitest';

// Mock dependencies before importing providers
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/nango/client', () => ({
  getNangoClient: vi.fn(() => ({
    triggerAction: vi.fn(),
    getConnection: vi.fn(),
  })),
  getConnectionId: vi.fn((userId: string, provider: string) => `${userId}_${provider}`),
}));

import {
  getProvider,
  getAllProviderNames,
  isNangoProvider,
  isCustomProvider,
  getNangoProviderNames,
  getCustomProviderNames,
  providers,
} from '../index';
import { QuickBooksProvider } from '../quickbooks';
import { ZohoBooksProvider } from '../zoho-books';
import { GoogleSheetsProvider } from '../google-sheets';
import { ExcelUploadProvider } from '../excel-upload';
import { NangoProviderBase } from '../nango-base';

describe('Provider Registry', () => {
  describe('getProvider', () => {
    it('should return QuickBooks provider when requested', () => {
      const provider = getProvider('quickbooks');
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(QuickBooksProvider);
    });

    it('should return Zoho Books provider when requested', () => {
      const provider = getProvider('zoho_books');
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(ZohoBooksProvider);
    });

    it('should return Google Sheets provider when requested', () => {
      const provider = getProvider('google_sheets');
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(GoogleSheetsProvider);
    });

    it('should return Excel Upload provider when requested', () => {
      const provider = getProvider('excel_upload');
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(ExcelUploadProvider);
    });

    it('should return undefined for non-existent provider', () => {
      const provider = getProvider('non_existent_provider');
      expect(provider).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const provider = getProvider('');
      expect(provider).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const provider = getProvider('QuickBooks'); // Wrong case
      expect(provider).toBeUndefined();
    });
  });

  describe('getAllProviderNames', () => {
    it('should return an array of all provider names', () => {
      const names = getAllProviderNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });

    it('should include quickbooks in the list', () => {
      const names = getAllProviderNames();
      expect(names).toContain('quickbooks');
    });

    it('should include all registered providers', () => {
      const names = getAllProviderNames();
      expect(names).toContain('zoho_books');
      expect(names).toContain('google_sheets');
      expect(names).toContain('excel_upload');
      expect(names).toContain('quickbooks');
    });

    it('should return exactly 4 providers', () => {
      const names = getAllProviderNames();
      expect(names).toHaveLength(4);
    });
  });

  describe('isNangoProvider', () => {
    it('should return true for QuickBooks provider', () => {
      const provider = getProvider('quickbooks');
      expect(provider).toBeDefined();
      expect(isNangoProvider(provider!)).toBe(true);
    });

    it('should return false for Zoho Books provider', () => {
      const provider = getProvider('zoho_books');
      expect(provider).toBeDefined();
      expect(isNangoProvider(provider!)).toBe(false);
    });

    it('should return false for Google Sheets provider', () => {
      const provider = getProvider('google_sheets');
      expect(provider).toBeDefined();
      expect(isNangoProvider(provider!)).toBe(false);
    });

    it('should return false for Excel Upload provider', () => {
      const provider = getProvider('excel_upload');
      expect(provider).toBeDefined();
      expect(isNangoProvider(provider!)).toBe(false);
    });

    it('should correctly identify NangoProviderBase instances', () => {
      const provider = getProvider('quickbooks');
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(NangoProviderBase);
      expect(isNangoProvider(provider!)).toBe(true);
    });
  });

  describe('isCustomProvider', () => {
    it('should return false for QuickBooks provider', () => {
      const provider = getProvider('quickbooks');
      expect(provider).toBeDefined();
      expect(isCustomProvider(provider!)).toBe(false);
    });

    it('should return true for Zoho Books provider', () => {
      const provider = getProvider('zoho_books');
      expect(provider).toBeDefined();
      expect(isCustomProvider(provider!)).toBe(true);
    });

    it('should return true for Google Sheets provider', () => {
      const provider = getProvider('google_sheets');
      expect(provider).toBeDefined();
      expect(isCustomProvider(provider!)).toBe(true);
    });

    it('should return true for Excel Upload provider', () => {
      const provider = getProvider('excel_upload');
      expect(provider).toBeDefined();
      expect(isCustomProvider(provider!)).toBe(true);
    });

    it('should be inverse of isNangoProvider', () => {
      const allProviders = getAllProviderNames().map(name => getProvider(name)!);
      
      allProviders.forEach(provider => {
        expect(isCustomProvider(provider)).toBe(!isNangoProvider(provider));
      });
    });
  });

  describe('getNangoProviderNames', () => {
    it('should return an array of Nango provider names', () => {
      const names = getNangoProviderNames();
      expect(Array.isArray(names)).toBe(true);
    });

    it('should include quickbooks', () => {
      const names = getNangoProviderNames();
      expect(names).toContain('quickbooks');
    });

    it('should not include custom providers', () => {
      const names = getNangoProviderNames();
      expect(names).not.toContain('zoho_books');
      expect(names).not.toContain('google_sheets');
      expect(names).not.toContain('excel_upload');
    });

    it('should return exactly 1 Nango provider currently', () => {
      const names = getNangoProviderNames();
      expect(names).toHaveLength(1);
    });

    it('should only contain providers that pass isNangoProvider check', () => {
      const nangoNames = getNangoProviderNames();
      
      nangoNames.forEach(name => {
        const provider = getProvider(name);
        expect(provider).toBeDefined();
        expect(isNangoProvider(provider!)).toBe(true);
      });
    });
  });

  describe('getCustomProviderNames', () => {
    it('should return an array of custom provider names', () => {
      const names = getCustomProviderNames();
      expect(Array.isArray(names)).toBe(true);
    });

    it('should include all custom providers', () => {
      const names = getCustomProviderNames();
      expect(names).toContain('zoho_books');
      expect(names).toContain('google_sheets');
      expect(names).toContain('excel_upload');
    });

    it('should not include Nango providers', () => {
      const names = getCustomProviderNames();
      expect(names).not.toContain('quickbooks');
    });

    it('should return exactly 3 custom providers currently', () => {
      const names = getCustomProviderNames();
      expect(names).toHaveLength(3);
    });

    it('should only contain providers that pass isCustomProvider check', () => {
      const customNames = getCustomProviderNames();
      
      customNames.forEach(name => {
        const provider = getProvider(name);
        expect(provider).toBeDefined();
        expect(isCustomProvider(provider!)).toBe(true);
      });
    });
  });

  describe('providers export', () => {
    it('should export the registry object', () => {
      expect(providers).toBeDefined();
      expect(typeof providers).toBe('object');
    });

    it('should contain all registered providers', () => {
      expect(providers.quickbooks).toBeDefined();
      expect(providers.zoho_books).toBeDefined();
      expect(providers.google_sheets).toBeDefined();
      expect(providers.excel_upload).toBeDefined();
    });

    it('should have providers that implement InvoiceProvider interface', () => {
      Object.values(providers).forEach(provider => {
        expect(provider.providerName).toBeDefined();
        expect(typeof provider.providerName).toBe('string');
        expect(provider.getCustomers).toBeDefined();
        expect(typeof provider.getCustomers).toBe('function');
        expect(provider.getInvoices).toBeDefined();
        expect(typeof provider.getInvoices).toBe('function');
      });
    });
  });

  describe('Registry Consistency', () => {
    it('should have matching counts between all functions', () => {
      const allNames = getAllProviderNames();
      const nangoNames = getNangoProviderNames();
      const customNames = getCustomProviderNames();

      expect(allNames.length).toBe(nangoNames.length + customNames.length);
    });

    it('should have no overlap between Nango and custom providers', () => {
      const nangoNames = getNangoProviderNames();
      const customNames = getCustomProviderNames();

      const overlap = nangoNames.filter(name => customNames.includes(name));
      expect(overlap).toHaveLength(0);
    });

    it('should have all providers accessible via getProvider', () => {
      const allNames = getAllProviderNames();

      allNames.forEach(name => {
        const provider = getProvider(name);
        expect(provider).toBeDefined();
      });
    });

    it('should have consistent provider names in registry keys and providerName property', () => {
      Object.entries(providers).forEach(([key, provider]) => {
        expect(provider.providerName).toBe(key);
      });
    });
  });

  describe('Type Guards Edge Cases', () => {
    it('should handle type narrowing correctly for Nango providers', () => {
      const provider = getProvider('quickbooks');
      
      if (provider && isNangoProvider(provider)) {
        // TypeScript should narrow the type here
        expect(provider.integrationId).toBeDefined();
        expect(typeof provider.integrationId).toBe('string');
      } else {
        throw new Error('QuickBooks should be a Nango provider');
      }
    });

    it('should correctly identify provider types in conditional logic', () => {
      const allNames = getAllProviderNames();
      let nangoCount = 0;
      let customCount = 0;

      allNames.forEach(name => {
        const provider = getProvider(name);
        if (provider) {
          if (isNangoProvider(provider)) {
            nangoCount++;
          } else {
            customCount++;
          }
        }
      });

      expect(nangoCount).toBe(getNangoProviderNames().length);
      expect(customCount).toBe(getCustomProviderNames().length);
    });
  });
});
