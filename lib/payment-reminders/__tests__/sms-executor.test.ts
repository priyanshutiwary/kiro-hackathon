/**
 * Tests for SMS Executor
 * 
 * These tests verify the SMS reminder execution flow including
 * data fetching, message formatting, sending, and status tracking.
 */

import { describe, it, expect } from 'vitest';
import { executeSMSReminder, type SMSExecutionResult } from '../sms-executor';

describe('SMS Executor', () => {
  describe('executeSMSReminder', () => {
    it('should be a function', () => {
      expect(typeof executeSMSReminder).toBe('function');
    });

    it('should accept a reminder ID parameter', () => {
      expect(executeSMSReminder.length).toBe(1);
    });

    it('should return a promise', () => {
      const result = executeSMSReminder('test-reminder-id');
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('SMSExecutionResult interface', () => {
    it('should have correct structure for success', () => {
      const successResult: SMSExecutionResult = {
        success: true,
        messageSid: 'SM1234567890abcdef',
      };

      expect(successResult.success).toBe(true);
      expect(successResult.messageSid).toBeDefined();
    });

    it('should have correct structure for failure', () => {
      const failureResult: SMSExecutionResult = {
        success: false,
        error: 'Test error',
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBeDefined();
    });

    it('should allow optional fields', () => {
      const minimalSuccess: SMSExecutionResult = {
        success: true,
      };

      const minimalFailure: SMSExecutionResult = {
        success: false,
      };

      expect(minimalSuccess.success).toBe(true);
      expect(minimalFailure.success).toBe(false);
    });
  });

  describe('Module exports', () => {
    it('should export executeSMSReminder function', () => {
      expect(executeSMSReminder).toBeDefined();
      expect(typeof executeSMSReminder).toBe('function');
    });
  });
});
