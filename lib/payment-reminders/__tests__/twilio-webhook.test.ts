import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/twilio/status/route';
import { db } from '@/db/drizzle';
import { paymentReminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Tests for Twilio webhook endpoint
 * 
 * Requirements:
 * - 6.1: Update reminder status when SMS is sent
 * - 6.2: Update reminder status when Twilio confirms delivery
 * - 6.3: Update reminder status when Twilio reports delivery failure
 * - 6.4: Record timestamp in lastAttemptAt when SMS status is updated
 * - 6.5: Handle Twilio webhook callbacks for status updates
 */

// Mock database
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

describe('Twilio Webhook Endpoint', () => {
  const mockAuthToken = 'test_auth_token_12345';
  const mockMessageSid = 'SM1234567890abcdef';
  const mockReminderId = 'reminder_123';
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TWILIO_AUTH_TOKEN = mockAuthToken;
  });

  /**
   * Helper function to create a valid Twilio signature
   */
  function createTwilioSignature(
    url: string,
    params: Record<string, string>,
    authToken: string
  ): string {
    let data = url;
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      data += key + params[key];
    }
    const hmac = crypto.createHmac('sha1', authToken);
    hmac.update(data);
    return hmac.digest('base64');
  }

  /**
   * Helper function to create a mock request
   */
  function createMockRequest(
    params: Record<string, string>,
    signature: string | null = null
  ): Request {
    const url = 'https://example.com/api/webhooks/twilio/status';
    const formData = new FormData();
    
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const headers = new Headers();
    if (signature) {
      headers.set('X-Twilio-Signature', signature);
    }

    return new Request(url, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  describe('Signature Validation', () => {
    it('should reject requests with invalid signature (Requirement 6.5)', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'delivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const request = createMockRequest(params, 'invalid_signature');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid signature');
    });

    it('should reject requests without signature header (Requirement 6.5)', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'delivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const request = createMockRequest(params, null);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should accept requests with valid signature (Requirement 6.5)', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'delivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      // Mock database responses
      const mockReminder = {
        id: mockReminderId,
        externalId: mockMessageSid,
        status: 'in_progress',
        channel: 'sms',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockReminder]),
          }),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Status Updates', () => {
    beforeEach(() => {
      // Mock database responses for all status update tests
      const mockReminder = {
        id: mockReminderId,
        externalId: mockMessageSid,
        status: 'in_progress',
        channel: 'sms',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockReminder]),
          }),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);
    });

    it('should update status to completed when message is delivered (Requirement 6.2)', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'delivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify database update was called with correct status
      expect(db.update).toHaveBeenCalled();
      const updateCall = vi.mocked(db.update).mock.results[0].value;
      const setCall = updateCall.set.mock.calls[0][0];
      
      expect(setCall.status).toBe('completed');
      expect(setCall.lastAttemptAt).toBeInstanceOf(Date);
    });

    it('should update status to failed when delivery fails (Requirement 6.3)', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'failed',
        To: '+1234567890',
        From: '+0987654321',
        ErrorCode: '30003',
        ErrorMessage: 'Unreachable destination handset',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify database update was called with correct status
      const updateCall = vi.mocked(db.update).mock.results[0].value;
      const setCall = updateCall.set.mock.calls[0][0];
      
      expect(setCall.status).toBe('failed');
      expect(setCall.lastAttemptAt).toBeInstanceOf(Date);
      expect(setCall.skipReason).toBeDefined();
      
      // Verify error information is stored
      const errorInfo = JSON.parse(setCall.skipReason);
      expect(errorInfo.errorCode).toBe('30003');
      expect(errorInfo.errorMessage).toBe('Unreachable destination handset');
    });

    it('should update lastAttemptAt timestamp (Requirement 6.4)', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'sent',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      const beforeTime = new Date();
      const response = await POST(request);
      const afterTime = new Date();

      expect(response.status).toBe(200);

      // Verify lastAttemptAt was updated
      const updateCall = vi.mocked(db.update).mock.results[0].value;
      const setCall = updateCall.set.mock.calls[0][0];
      
      expect(setCall.lastAttemptAt).toBeInstanceOf(Date);
      expect(setCall.lastAttemptAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(setCall.lastAttemptAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should map "sent" status to completed (Requirement 6.2)', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'sent',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      await POST(request);

      const updateCall = vi.mocked(db.update).mock.results[0].value;
      const setCall = updateCall.set.mock.calls[0][0];
      
      expect(setCall.status).toBe('completed');
    });

    it('should map "undelivered" status to failed (Requirement 6.3)', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'undelivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      await POST(request);

      const updateCall = vi.mocked(db.update).mock.results[0].value;
      const setCall = updateCall.set.mock.calls[0][0];
      
      expect(setCall.status).toBe('failed');
    });

    it('should map "queued" status to in_progress', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'queued',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      await POST(request);

      const updateCall = vi.mocked(db.update).mock.results[0].value;
      const setCall = updateCall.set.mock.calls[0][0];
      
      expect(setCall.status).toBe('in_progress');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when reminder not found', async () => {
      const params = {
        MessageSid: 'SM_nonexistent',
        MessageStatus: 'delivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      // Mock empty result
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Reminder not found');
    });

    it('should return 400 when MessageSid is missing', async () => {
      const params = {
        MessageStatus: 'delivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Missing required fields');
    });

    it('should return 400 when MessageStatus is missing', async () => {
      const params = {
        MessageSid: mockMessageSid,
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 500 when TWILIO_AUTH_TOKEN is not configured', async () => {
      delete process.env.TWILIO_AUTH_TOKEN;

      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'delivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const request = createMockRequest(params, 'some_signature');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('not configured');
    });

    it('should return 500 and not crash on database errors', async () => {
      const params = {
        MessageSid: mockMessageSid,
        MessageStatus: 'delivered',
        To: '+1234567890',
        From: '+0987654321',
      };

      const url = 'https://example.com/api/webhooks/twilio/status';
      const signature = createTwilioSignature(url, params, mockAuthToken);
      const request = createMockRequest(params, signature);

      // Mock database error
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
    });
  });
});
