/**
 * Business Profile Service Tests
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the database to prevent connection issues
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { formatPaymentMethods, formatBusinessHours } from '../service';

describe('Business Profile Service', () => {
  describe('formatPaymentMethods', () => {
    it('should format single payment method', () => {
      const result = formatPaymentMethods(['credit_card']);
      expect(result).toBe('credit card');
    });

    it('should format two payment methods', () => {
      const result = formatPaymentMethods(['credit_card', 'bank_transfer']);
      expect(result).toBe('credit card and bank transfer');
    });

    it('should format multiple payment methods', () => {
      const result = formatPaymentMethods(['credit_card', 'bank_transfer', 'check']);
      expect(result).toBe('credit card, bank transfer, and check');
    });

    it('should handle empty array', () => {
      const result = formatPaymentMethods([]);
      expect(result).toBe('various payment methods');
    });

    it('should handle unknown payment methods', () => {
      const result = formatPaymentMethods(['unknown_method']);
      expect(result).toBe('unknown_method');
    });
  });

  describe('formatBusinessHours', () => {
    it('should format standard weekday hours', () => {
      const hours = {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed',
      };
      const result = formatBusinessHours(hours);
      expect(result).toBe('Monday through Friday, 9:00 AM - 5:00 PM');
    });

    it('should handle null business hours', () => {
      const result = formatBusinessHours(null);
      expect(result).toBe('during business hours');
    });

    it('should format custom hours', () => {
      const hours = {
        monday: '10:00 AM - 6:00 PM',
        tuesday: '10:00 AM - 6:00 PM',
        wednesday: 'Closed',
        thursday: '10:00 AM - 6:00 PM',
        friday: '10:00 AM - 6:00 PM',
        saturday: '9:00 AM - 2:00 PM',
        sunday: 'Closed',
      };
      const result = formatBusinessHours(hours);
      expect(result).toContain('Monday: 10:00 AM - 6:00 PM');
      expect(result).toContain('Saturday: 9:00 AM - 2:00 PM');
      expect(result).not.toContain('Wednesday');
      expect(result).not.toContain('Sunday');
    });

    it('should handle all closed days', () => {
      const hours = {
        monday: 'Closed',
        tuesday: 'Closed',
        wednesday: 'Closed',
        thursday: 'Closed',
        friday: 'Closed',
        saturday: 'Closed',
        sunday: 'Closed',
      };
      const result = formatBusinessHours(hours);
      // Current implementation returns "Monday through Friday, Closed" for all closed weekdays
      expect(result).toBe('Monday through Friday, Closed');
    });
  });
});