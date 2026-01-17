import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateAuthConfiguration } from '../auth';
import { validateEmailConfiguration } from '../email';

describe('Authentication Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEmailConfiguration', () => {
    it('should pass with valid configuration', () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.RESEND_FROM_EMAIL = 'test@example.com';

      expect(() => validateEmailConfiguration()).not.toThrow();
    });

    it('should throw error when RESEND_API_KEY is missing', () => {
      delete process.env.RESEND_API_KEY;

      expect(() => validateEmailConfiguration()).toThrow('Missing required environment variables: RESEND_API_KEY');
    });

    it('should warn about invalid API key format', () => {
      process.env.RESEND_API_KEY = 'invalid_key_format';
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(() => validateEmailConfiguration()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('RESEND_API_KEY does not appear to be in the correct format')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('validateAuthConfiguration', () => {
    it('should pass with valid configuration', () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.BETTER_AUTH_SECRET = 'a-very-long-secret-key-that-is-secure-enough-for-testing';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      expect(() => validateAuthConfiguration()).not.toThrow();
    });

    it('should throw error when required variables are missing', () => {
      process.env.RESEND_API_KEY = 're_test_key_123'; // Set this so email validation passes
      delete process.env.BETTER_AUTH_SECRET;
      delete process.env.NEXT_PUBLIC_APP_URL;

      expect(() => validateAuthConfiguration()).toThrow(
        'Missing required environment variables: BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL'
      );
    });

    it('should warn about short auth secret', () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.BETTER_AUTH_SECRET = 'short';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(() => validateAuthConfiguration()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('BETTER_AUTH_SECRET should be at least 32 characters long')
      );
      
      consoleSpy.mockRestore();
    });

    it('should warn about invalid APP_URL format', () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.BETTER_AUTH_SECRET = 'a-very-long-secret-key-that-is-secure-enough-for-testing';
      process.env.NEXT_PUBLIC_APP_URL = 'invalid-url';
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(() => validateAuthConfiguration()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('NEXT_PUBLIC_APP_URL should start with http:// or https://')
      );
      
      consoleSpy.mockRestore();
    });
  });
});