/**
 * Tests for LiveKit Client
 * 
 * These tests verify the interfaces, validation, and error handling
 * of the LiveKit client module.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  makeCall,
  getCallStatus,
  CallContext,
  InvalidPhoneNumberError,
  ConfigurationError,
  CallInitiationError,
} from '../livekit-client';

describe('LiveKit Client', () => {
  const validContext: CallContext = {
    customerName: 'John Doe',
    invoiceNumber: 'INV-001',
    originalAmount: 1000.00,
    amountDue: 1000.00,
    dueDate: '2024-02-15',
    daysUntilDue: 5,
    isOverdue: false,
    paymentMethods: ['credit_card', 'bank_transfer'],
    companyName: 'Acme Corp',
    supportPhone: '+1234567890',
  };

  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set up test environment variables
    process.env.LIVEKIT_API_URL = 'https://test.livekit.com';
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Phone Number Validation', () => {
    it('should reject empty phone number', async () => {
      await expect(makeCall('', validContext))
        .rejects
        .toThrow(InvalidPhoneNumberError);
    });

    it('should reject phone number without + prefix', async () => {
      await expect(makeCall('1234567890', validContext))
        .rejects
        .toThrow(InvalidPhoneNumberError);
    });

    it('should reject phone number with invalid format', async () => {
      await expect(makeCall('+abc123', validContext))
        .rejects
        .toThrow(InvalidPhoneNumberError);
    });

    it('should reject phone number starting with +0', async () => {
      await expect(makeCall('+0123456789', validContext))
        .rejects
        .toThrow(InvalidPhoneNumberError);
    });

    it('should reject phone number that is too short', async () => {
      await expect(makeCall('+1', validContext))
        .rejects
        .toThrow(InvalidPhoneNumberError);
    });

    it('should reject phone number that is too long', async () => {
      await expect(makeCall('+12345678901234567', validContext))
        .rejects
        .toThrow(InvalidPhoneNumberError);
    });

    it('should accept valid E.164 phone number', async () => {
      // This will throw CallInitiationError because SDK is not implemented
      // but it passes phone validation
      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should accept valid international phone number', async () => {
      // This will throw CallInitiationError because SDK is not implemented
      // but it passes phone validation
      await expect(makeCall('+447911123456', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw ConfigurationError when LIVEKIT_API_URL is missing', async () => {
      delete process.env.LIVEKIT_API_URL;

      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError when LIVEKIT_API_KEY is missing', async () => {
      delete process.env.LIVEKIT_API_KEY;

      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError when LIVEKIT_API_SECRET is missing', async () => {
      delete process.env.LIVEKIT_API_SECRET;

      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(ConfigurationError);
    });
  });

  describe('CallContext Interface', () => {
    it('should accept valid call context', async () => {
      // This will throw CallInitiationError because SDK is not implemented
      // but it validates the context structure
      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should handle overdue invoices', async () => {
      const overdueContext: CallContext = {
        ...validContext,
        daysUntilDue: -3,
        isOverdue: true,
      };

      await expect(makeCall('+1234567890', overdueContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should handle due today invoices', async () => {
      const dueTodayContext: CallContext = {
        ...validContext,
        daysUntilDue: 0,
        isOverdue: false,
      };

      await expect(makeCall('+1234567890', dueTodayContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should handle partially paid invoices', async () => {
      const partiallyPaidContext: CallContext = {
        ...validContext,
        originalAmount: 1000.00,
        amountDue: 500.00,
      };

      await expect(makeCall('+1234567890', partiallyPaidContext))
        .rejects
        .toThrow(CallInitiationError);
    });
  });

  describe('getCallStatus', () => {
    it('should throw CallInitiationError when not implemented', async () => {
      await expect(getCallStatus('test-call-id'))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should throw ConfigurationError when config is missing', async () => {
      delete process.env.LIVEKIT_API_URL;

      await expect(getCallStatus('test-call-id'))
        .rejects
        .toThrow(ConfigurationError);
    });
  });
});
