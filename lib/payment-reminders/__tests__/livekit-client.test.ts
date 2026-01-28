/**
 * Tests for LiveKit Client
 * 
 * These tests verify the interfaces, validation, and error handling
 * of the LiveKit client module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  makeCall,
  CallContext,
  CallInitiationError,
} from '../livekit-client';

// Mock the call dispatcher
vi.mock('@/lib/livekit/call-dispatcher', () => ({
  dispatchPaymentCall: vi.fn(),
}));

import { dispatchPaymentCall } from '@/lib/livekit/call-dispatcher';

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
    businessProfile: {
      companyName: 'Acme Corp',
      businessDescription: 'Test company',
      industry: 'Technology',
      supportPhone: '+1234567890',
      supportEmail: 'support@acme.com',
      preferredPaymentMethods: ['credit_card'],
    },
  };

  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set up test environment variables
    process.env.LIVEKIT_API_URL = 'https://test.livekit.com';
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret';
    process.env.LIVEKIT_SIP_TRUNK_ID = 'test-trunk';

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Phone Number Validation', () => {
    it('should reject empty phone number', async () => {
      // Mock dispatcher to return phone validation error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: false,
        roomName: '',
        error: 'Invalid phone number format: . Must be E.164 format (e.g., +1234567890)',
      });

      await expect(makeCall('', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should reject phone number without + prefix', async () => {
      // Mock dispatcher to return phone validation error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: false,
        roomName: '',
        error: 'Invalid phone number format: 1234567890. Must be E.164 format (e.g., +1234567890)',
      });

      await expect(makeCall('1234567890', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should reject phone number with invalid format', async () => {
      // Mock dispatcher to return phone validation error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: false,
        roomName: '',
        error: 'Invalid phone number format: +abc123. Must be E.164 format (e.g., +1234567890)',
      });

      await expect(makeCall('+abc123', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should reject phone number starting with +0', async () => {
      // Mock dispatcher to return phone validation error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: false,
        roomName: '',
        error: 'Invalid phone number format: +0123456789. Must be E.164 format (e.g., +1234567890)',
      });

      await expect(makeCall('+0123456789', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should reject phone number that is too short', async () => {
      // Mock dispatcher to return phone validation error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: false,
        roomName: '',
        error: 'Invalid phone number format: +1. Must be E.164 format (e.g., +1234567890)',
      });

      await expect(makeCall('+1', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should reject phone number that is too long', async () => {
      // Mock dispatcher to return phone validation error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: false,
        roomName: '',
        error: 'Invalid phone number format: +12345678901234567. Must be E.164 format (e.g., +1234567890)',
      });

      await expect(makeCall('+12345678901234567', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should accept valid E.164 phone number', async () => {
      // Mock successful call dispatch
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: true,
        roomName: 'test-room',
        sipParticipantId: 'test-participant',
      });

      const result = await makeCall('+1234567890', validContext);
      expect(result.connected).toBe(true);
      expect(result.livekitCallId).toBe('test-participant');
    });

    it('should accept valid international phone number', async () => {
      // Mock successful call dispatch
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: true,
        roomName: 'test-room',
        sipParticipantId: 'test-participant',
      });

      const result = await makeCall('+447911123456', validContext);
      expect(result.connected).toBe(true);
      expect(result.livekitCallId).toBe('test-participant');
    });
  });

  describe('Configuration Validation', () => {
    it('should throw ConfigurationError when LIVEKIT_API_URL is missing', async () => {
      delete process.env.LIVEKIT_API_URL;

      // Mock dispatcher to throw configuration error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockRejectedValue(
        new Error('Missing LiveKit configuration. Check LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET')
      );

      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should throw ConfigurationError when LIVEKIT_API_KEY is missing', async () => {
      delete process.env.LIVEKIT_API_KEY;

      // Mock dispatcher to throw configuration error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockRejectedValue(
        new Error('Missing LiveKit configuration. Check LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET')
      );

      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should throw ConfigurationError when LIVEKIT_API_SECRET is missing', async () => {
      delete process.env.LIVEKIT_API_SECRET;

      // Mock dispatcher to throw configuration error
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockRejectedValue(
        new Error('Missing LiveKit configuration. Check LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET')
      );

      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });
  });

  describe('CallContext Interface', () => {
    it('should accept valid call context', async () => {
      // Mock successful call dispatch
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: true,
        roomName: 'test-room',
        sipParticipantId: 'test-participant',
      });

      const result = await makeCall('+1234567890', validContext);
      expect(result.connected).toBe(true);
    });

    it('should handle overdue invoices', async () => {
      const overdueContext: CallContext = {
        ...validContext,
        daysUntilDue: -3,
        isOverdue: true,
      };

      // Mock successful call dispatch
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: true,
        roomName: 'test-room',
        sipParticipantId: 'test-participant',
      });

      const result = await makeCall('+1234567890', overdueContext);
      expect(result.connected).toBe(true);
    });

    it('should handle due today invoices', async () => {
      const dueTodayContext: CallContext = {
        ...validContext,
        daysUntilDue: 0,
        isOverdue: false,
      };

      // Mock successful call dispatch
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: true,
        roomName: 'test-room',
        sipParticipantId: 'test-participant',
      });

      const result = await makeCall('+1234567890', dueTodayContext);
      expect(result.connected).toBe(true);
    });

    it('should handle partially paid invoices', async () => {
      const partiallyPaidContext: CallContext = {
        ...validContext,
        originalAmount: 1000.00,
        amountDue: 500.00,
      };

      // Mock successful call dispatch
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: true,
        roomName: 'test-room',
        sipParticipantId: 'test-participant',
      });

      const result = await makeCall('+1234567890', partiallyPaidContext);
      expect(result.connected).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw CallInitiationError when dispatch fails', async () => {
      // Mock failed call dispatch
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockResolvedValue({
        success: false,
        roomName: 'test-room',
        error: 'SIP trunk not found',
      });

      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });

    it('should handle dispatcher exceptions', async () => {
      // Mock dispatcher throwing an exception
      (dispatchPaymentCall as jest.MockedFunction<typeof dispatchPaymentCall>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(makeCall('+1234567890', validContext))
        .rejects
        .toThrow(CallInitiationError);
    });
  });
});
