import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emailService, validateEmailConfiguration } from '../email';

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function() {
    return {
      emails: {
        send: vi.fn().mockResolvedValue({ data: { id: 'test-email-id' } }),
      },
    };
  }),
}));

describe('Email Service', () => {
  beforeEach(() => {
    // Set up test environment variables
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_APP_NAME = 'InvoCall Test';
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.invocall.com';
    process.env.RESEND_FROM_EMAIL = 'InvoCall Test <test@invocall.com>';
  });

  describe('validateEmailConfiguration', () => {
    it('should validate successfully with required environment variables', () => {
      expect(() => validateEmailConfiguration()).not.toThrow();
    });

    it('should throw error when RESEND_API_KEY is missing', () => {
      delete process.env.RESEND_API_KEY;
      
      expect(() => validateEmailConfiguration()).toThrow(
        'Missing required environment variables: RESEND_API_KEY'
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      const email = 'test@example.com';
      const verificationUrl = 'https://test.invocall.com/verify?token=abc123';

      await expect(
        emailService.sendVerificationEmail(email, verificationUrl)
      ).resolves.not.toThrow();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const email = 'test@example.com';
      const resetUrl = 'https://test.invocall.com/reset-password?token=xyz789';

      await expect(
        emailService.sendPasswordResetEmail(email, resetUrl)
      ).resolves.not.toThrow();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const email = 'test@example.com';
      const name = 'John Doe';
      const dashboardUrl = 'https://test.invocall.com/dashboard';

      await expect(
        emailService.sendWelcomeEmail(email, name, dashboardUrl)
      ).resolves.not.toThrow();
    });
  });

  describe('sendEmail', () => {
    it('should throw error when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY;

      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test Email',
          template: 'verify-email',
          data: {
            email: 'test@example.com',
            verificationUrl: 'https://test.invocall.com/verify',
            appName: 'InvoCall Test',
          },
        })
      ).rejects.toThrow('RESEND_API_KEY environment variable is not set');
    });
  });
});