import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, isValidPhoneForCalling, normalizePhoneNumbers } from '../phone-normalizer';

describe('Phone Normalizer', () => {
  describe('normalizePhoneNumber', () => {
    it('should normalize Indian phone numbers with +91', () => {
      const result = normalizePhoneNumber('+91-6202390324', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+91-6202390324');
      expect(result.country).toBe('IN');
    });

    it('should normalize Indian phone numbers without country code', () => {
      const result = normalizePhoneNumber('916202390324', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+91-6202390324');
    });

    it('should normalize US phone numbers with +1 prefix', () => {
      const result = normalizePhoneNumber('+1 703 285 8909', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+1-7032858909');
      expect(result.country).toBe('US');
    });

    it('should normalize US phone numbers without + but starting with 1', () => {
      const result = normalizePhoneNumber('17032858909', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+1-7032858909');
      expect(result.country).toBe('US');
    });

    it('should normalize US phone numbers with various formats', () => {
      const formats = [
        { input: '(617) 555-1234', expected: '+1-6175551234' },
        { input: '617-555-1234', expected: '+1-6175551234' },
        { input: '617.555.1234', expected: '+1-6175551234' },
        { input: '+1 617 555 1234', expected: '+1-6175551234' },
        { input: '+1-617-555-1234', expected: '+1-6175551234' },
      ];

      formats.forEach(({ input, expected }) => {
        const result = normalizePhoneNumber(input, 'US');
        expect(result.success).toBe(true);
        expect(result.normalized).toBe(expected);
      });
    });

    it('should handle phone numbers with spaces', () => {
      const result = normalizePhoneNumber('+91 620 239 0324', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+91-6202390324');
    });

    it('should handle phone numbers with dashes', () => {
      const result = normalizePhoneNumber('+91-620-239-0324', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+91-6202390324');
    });

    it('should handle phone numbers with parentheses', () => {
      const result = normalizePhoneNumber('+91 (620) 239-0324', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+91-6202390324');
    });

    it('should handle phone numbers with dots', () => {
      const result = normalizePhoneNumber('+91.620.239.0324', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+91-6202390324');
    });

    it('should NOT add +91 to US numbers that already have +1', () => {
      const result = normalizePhoneNumber('+17032858909', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+1-7032858909');
      expect(result.country).toBe('US');
    });

    it('should detect UK numbers with +44', () => {
      const result = normalizePhoneNumber('+44 20 7946 0958', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+44-2079460958');
      expect(result.country).toBe('GB');
    });

    it('should handle Indian numbers starting with 91 (12 digits)', () => {
      const result = normalizePhoneNumber('916202390324', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+91-6202390324');
      expect(result.country).toBe('IN');
    });

    it('should handle UK numbers starting with 44', () => {
      const result = normalizePhoneNumber('442079460958', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+44-2079460958');
      expect(result.country).toBe('GB');
    });

    it('should handle Australian numbers starting with 61', () => {
      const result = normalizePhoneNumber('61412345678', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+61-412345678');
      expect(result.country).toBe('AU');
    });

    it('should handle Canadian numbers (same as US, +1)', () => {
      const result = normalizePhoneNumber('14165551234', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+1-4165551234');
      expect(result.country).toBe('CA');
    });

    it('should handle German numbers starting with 49', () => {
      const result = normalizePhoneNumber('4930123456', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+49-30123456');
      expect(result.country).toBe('DE');
    });

    it('should handle French numbers starting with 33', () => {
      const result = normalizePhoneNumber('33123456789', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+33-123456789');
      expect(result.country).toBe('FR');
    });

    it('should handle Singapore numbers starting with 65', () => {
      const result = normalizePhoneNumber('6591234567', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+65-91234567');
      expect(result.country).toBe('SG');
    });

    it('should return error for empty phone number', () => {
      const result = normalizePhoneNumber('', 'IN');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone number is empty');
    });

    it('should return error for null phone number', () => {
      const result = normalizePhoneNumber(null, 'IN');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone number is empty');
    });

    it('should return error for invalid phone number', () => {
      const result = normalizePhoneNumber('123', 'IN');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should detect country from international format', () => {
      const result = normalizePhoneNumber('+44 20 7946 0958'); // UK number
      expect(result.success).toBe(true);
      expect(result.country).toBe('GB');
    });

    it('should handle mixed format with country code', () => {
      const result = normalizePhoneNumber('+1 (703) 285-8909', 'IN');
      expect(result.success).toBe(true);
      expect(result.normalized).toBe('+1-7032858909');
      expect(result.country).toBe('US');
    });
  });

  describe('isValidPhoneForCalling', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhoneForCalling('+916202390324', 'IN')).toBe(true);
      expect(isValidPhoneForCalling('+16175551234', 'US')).toBe(true);
      expect(isValidPhoneForCalling('+1-617-555-1234', 'US')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhoneForCalling('123', 'IN')).toBe(false);
      expect(isValidPhoneForCalling('', 'IN')).toBe(false);
      expect(isValidPhoneForCalling(null, 'IN')).toBe(false);
    });
  });

  describe('normalizePhoneNumbers', () => {
    it('should normalize multiple phone numbers', () => {
      const phones = ['+91-6202390324', '916202390324', '17032858909', null, '123'];
      const results = normalizePhoneNumbers(phones, 'IN');

      expect(results).toHaveLength(5);
      expect(results[0].success).toBe(true);
      expect(results[0].normalized).toBe('+91-6202390324');
      expect(results[1].success).toBe(true);
      expect(results[1].normalized).toBe('+91-6202390324');
      expect(results[2].success).toBe(true);
      expect(results[2].normalized).toBe('+1-7032858909');
      expect(results[3].success).toBe(false);
      expect(results[4].success).toBe(false);
    });
  });
});
