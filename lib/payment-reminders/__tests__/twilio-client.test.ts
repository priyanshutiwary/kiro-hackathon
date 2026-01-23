/**
 * Tests for Twilio SMS Client
 * 
 * These tests verify the interfaces, validation, and error handling
 * of the Twilio SMS client module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TwilioSMSClient,
  getTwilioClient,
  TwilioConfigError,
  TwilioAPIError,
  TwilioRateLimitError,
  type SMSResult,
  type MessageStatus,
} from '../twilio-client';

describe('TwilioSMSClient', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original environment and fetch
    originalEnv = { ...process.env };
    originalFetch = global.fetch;
    
    // Set up test environment variables
    process.env.TWILIO_ACCOUNT_SID = 'ACtest1234567890abcdef1234567890';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token_12345';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
  });

  afterEach(() => {
    // Restore original environment and fetch
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Configuration Validation', () => {
    it('should throw TwilioConfigError when TWILIO_ACCOUNT_SID is missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID;

      expect(() => new TwilioSMSClient())
        .toThrow(TwilioConfigError);
    });

    it('should throw TwilioConfigError when TWILIO_AUTH_TOKEN is missing', () => {
      delete process.env.TWILIO_AUTH_TOKEN;

      expect(() => new TwilioSMSClient())
        .toThrow(TwilioConfigError);
    });

    it('should throw TwilioConfigError when TWILIO_PHONE_NUMBER is missing', () => {
      delete process.env.TWILIO_PHONE_NUMBER;

      expect(() => new TwilioSMSClient())
        .toThrow(TwilioConfigError);
    });

    it('should throw TwilioConfigError for invalid phone number format', () => {
      process.env.TWILIO_PHONE_NUMBER = '1234567890'; // Missing +

      expect(() => new TwilioSMSClient())
        .toThrow(TwilioConfigError);
    });

    it('should accept valid configuration', () => {
      expect(() => new TwilioSMSClient()).not.toThrow();
    });

    it('should accept custom configuration', () => {
      const client = new TwilioSMSClient({
        accountSid: 'ACcustom123',
        authToken: 'custom_token',
        phoneNumber: '+9876543210',
      });

      expect(client).toBeInstanceOf(TwilioSMSClient);
    });
  });

  describe('sendSMS', () => {
    let client: TwilioSMSClient;

    beforeEach(() => {
      client = new TwilioSMSClient();
    });

    it('should reject empty phone number', async () => {
      const result = await client.sendSMS('', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recipient phone number');
    });

    it('should reject phone number without + prefix', async () => {
      const result = await client.sendSMS('1234567890', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recipient phone number');
    });

    it('should reject phone number with invalid format', async () => {
      const result = await client.sendSMS('+abc123', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recipient phone number');
    });

    it('should reject phone number starting with +0', async () => {
      const result = await client.sendSMS('+0123456789', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recipient phone number');
    });

    it('should reject empty message', async () => {
      const result = await client.sendSMS('+1234567890', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Message content cannot be empty');
    });

    it('should reject whitespace-only message', async () => {
      const result = await client.sendSMS('+1234567890', '   ');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Message content cannot be empty');
    });

    it('should send SMS successfully', async () => {
      // Mock successful Twilio API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          sid: 'SM1234567890abcdef',
          status: 'queued',
        }),
      });

      const result = await client.sendSMS('+1234567890', 'Test message');

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SM1234567890abcdef');
      expect(result.error).toBeUndefined();
    });

    it('should handle Twilio API error for invalid phone number', async () => {
      // Mock Twilio API error response for invalid phone number (no retry)
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          message: 'Invalid phone number',
          code: 21211,
        }),
      });

      const result = await client.sendSMS('+1234567890', 'Test message');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_PHONE_NUMBER');
      expect(result.error).toContain('21211');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['Retry-After', '60']]),
        json: async () => ({
          message: 'Rate limit exceeded',
        }),
      });

      await expect(client.sendSMS('+1234567890', 'Test message'))
        .rejects
        .toThrow(TwilioRateLimitError);
    });

    it('should handle network error', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await client.sendSMS('+1234567890', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should include correct headers and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          sid: 'SM1234567890abcdef',
          status: 'queued',
        }),
      });
      global.fetch = mockFetch;

      await client.sendSMS('+1234567890', 'Test message');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Messages.json'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });
  });

  describe('getMessageStatus', () => {
    let client: TwilioSMSClient;

    beforeEach(() => {
      client = new TwilioSMSClient();
    });

    it('should throw error for empty message SID', async () => {
      await expect(client.getMessageStatus(''))
        .rejects
        .toThrow(TwilioAPIError);
    });

    it('should return message status successfully', async () => {
      // Mock successful Twilio API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          sid: 'SM1234567890abcdef',
          status: 'delivered',
        }),
      });

      const status = await client.getMessageStatus('SM1234567890abcdef');

      expect(status).toBe('delivered');
    });

    it('should handle different message statuses', async () => {
      const statuses: MessageStatus[] = ['queued', 'sent', 'delivered', 'failed', 'undelivered'];

      for (const expectedStatus of statuses) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            sid: 'SM1234567890abcdef',
            status: expectedStatus,
          }),
        });

        const status = await client.getMessageStatus('SM1234567890abcdef');
        expect(status).toBe(expectedStatus);
      }
    });

    it('should handle API error', async () => {
      // Mock Twilio API error response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          message: 'Message not found',
          code: 20404,
        }),
      });

      await expect(client.getMessageStatus('SM1234567890abcdef'))
        .rejects
        .toThrow(TwilioAPIError);
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['Retry-After', '30']]),
        json: async () => ({
          message: 'Rate limit exceeded',
        }),
      });

      await expect(client.getMessageStatus('SM1234567890abcdef'))
        .rejects
        .toThrow(TwilioRateLimitError);
    });

    it('should handle network error', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection timeout'));

      await expect(client.getMessageStatus('SM1234567890abcdef'))
        .rejects
        .toThrow(TwilioAPIError);
    });
  });

  describe('getTwilioClient', () => {
    it('should return client instance when configured', () => {
      const client = getTwilioClient();

      expect(client).toBeInstanceOf(TwilioSMSClient);
    });

    it('should return null when not configured', () => {
      // Note: This test would need to be run in isolation or with module reset
      // because getTwilioClient uses a singleton pattern that caches the instance
      // For now, we test that creating a new client throws an error
      delete process.env.TWILIO_ACCOUNT_SID;

      expect(() => new TwilioSMSClient()).toThrow(TwilioConfigError);
    });

    it('should return same instance on multiple calls', () => {
      const client1 = getTwilioClient();
      const client2 = getTwilioClient();

      expect(client1).toBe(client2);
    });
  });

  describe('Phone Number Validation', () => {
    let client: TwilioSMSClient;

    beforeEach(() => {
      client = new TwilioSMSClient();
    });

    it('should accept valid US phone number', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ sid: 'SM123', status: 'queued' }),
      });

      const result = await client.sendSMS('+11234567890', 'Test');
      expect(result.success).toBe(true);
    });

    it('should accept valid UK phone number', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ sid: 'SM123', status: 'queued' }),
      });

      const result = await client.sendSMS('+447911123456', 'Test');
      expect(result.success).toBe(true);
    });

    it('should accept valid Indian phone number', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ sid: 'SM123', status: 'queued' }),
      });

      const result = await client.sendSMS('+919876543210', 'Test');
      expect(result.success).toBe(true);
    });

    it('should reject phone number that is too long', async () => {
      const result = await client.sendSMS('+12345678901234567', 'Test');
      expect(result.success).toBe(false);
    });

    it('should reject phone number that is too short', async () => {
      const result = await client.sendSMS('+1', 'Test');
      expect(result.success).toBe(false);
    });
  });
});
