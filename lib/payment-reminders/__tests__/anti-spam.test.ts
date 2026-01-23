/**
 * Anti-Spam Protection Tests
 * 
 * Tests for anti-spam protection functions including:
 * - Duplicate prevention
 * - Opposite channel prevention
 * - Business hours enforcement
 * - Retry delay enforcement
 * - Max attempts enforcement
 * - Cancelling pending reminders
 */

import { describe, it, expect, vi } from 'vitest';
import {
  hasDuplicateReminder,
  hasOppositeChannelOnSameDay,
  isWithinBusinessHours,
  canRetryNow,
  hasAttemptsRemaining,
  cancelPendingReminders,
  canSendReminder,
} from '../anti-spam';
import { ReminderSettings } from '../settings-manager';

// Mock database
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

describe('Anti-Spam Protection', () => {
  describe('hasDuplicateReminder', () => {
    it('should return true if duplicate reminder exists', async () => {
      const { db } = await import('@/db/drizzle');
      
      // Mock database to return existing reminder
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'reminder-1' }]),
          }),
        }),
      });
      
      (db.select as unknown as ReturnType<typeof vi.fn>) = mockSelect;
      
      const result = await hasDuplicateReminder(
        'invoice-1',
        new Date('2024-01-15T10:00:00Z')
      );
      
      expect(result).toBe(true);
    });
    
    it('should return false if no duplicate reminder exists', async () => {
      const { db } = await import('@/db/drizzle');
      
      // Mock database to return no reminders
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      
      (db.select as unknown as ReturnType<typeof vi.fn>) = mockSelect;
      
      const result = await hasDuplicateReminder(
        'invoice-1',
        new Date('2024-01-15T10:00:00Z')
      );
      
      expect(result).toBe(false);
    });
  });
  
  describe('hasOppositeChannelOnSameDay', () => {
    it('should return true if opposite channel exists on same day', async () => {
      const { db } = await import('@/db/drizzle');
      
      // Mock database to return existing voice reminder
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'reminder-1', channel: 'voice' }]),
          }),
        }),
      });
      
      (db.select as unknown as ReturnType<typeof vi.fn>) = mockSelect;
      
      const result = await hasOppositeChannelOnSameDay(
        'invoice-1',
        new Date('2024-01-15T10:00:00Z'),
        'sms'
      );
      
      expect(result).toBe(true);
    });
    
    it('should return false if opposite channel does not exist', async () => {
      const { db } = await import('@/db/drizzle');
      
      // Mock database to return no reminders
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      
      (db.select as unknown as ReturnType<typeof vi.fn>) = mockSelect;
      
      const result = await hasOppositeChannelOnSameDay(
        'invoice-1',
        new Date('2024-01-15T10:00:00Z'),
        'sms'
      );
      
      expect(result).toBe(false);
    });
  });
  
  describe('isWithinBusinessHours', () => {
    it('should return true if within business hours', () => {
      // Mock current time to be within business hours
      const mockDate = new Date('2024-01-15T14:00:00Z'); // Monday 2 PM UTC
      vi.setSystemTime(mockDate);
      
      const settings: ReminderSettings = {
        userId: 'user-1',
        organizationId: 'org-1',
        callTimezone: 'UTC',
        callStartTime: '09:00:00',
        callEndTime: '18:00:00',
        callDaysOfWeek: [1, 2, 3, 4, 5], // Weekdays
        reminder30DaysBefore: false,
        reminder15DaysBefore: false,
        reminder7DaysBefore: true,
        reminder5DaysBefore: false,
        reminder3DaysBefore: true,
        reminder1DayBefore: true,
        reminderOnDueDate: true,
        reminder1DayOverdue: true,
        reminder3DaysOverdue: true,
        reminder7DaysOverdue: false,
        customReminderDays: [],
        language: 'en',
        voiceGender: 'female',
        smartMode: true,
        manualChannel: 'voice',
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      };
      
      const result = isWithinBusinessHours(settings);
      
      expect(result.canSend).toBe(true);
      
      vi.useRealTimers();
    });
    
    it('should return false if outside business hours (too early)', () => {
      // Mock current time to be before business hours
      const mockDate = new Date('2024-01-15T08:00:00Z'); // Monday 8 AM UTC
      vi.setSystemTime(mockDate);
      
      const settings: ReminderSettings = {
        userId: 'user-1',
        organizationId: 'org-1',
        callTimezone: 'UTC',
        callStartTime: '09:00:00',
        callEndTime: '18:00:00',
        callDaysOfWeek: [1, 2, 3, 4, 5],
        reminder30DaysBefore: false,
        reminder15DaysBefore: false,
        reminder7DaysBefore: true,
        reminder5DaysBefore: false,
        reminder3DaysBefore: true,
        reminder1DayBefore: true,
        reminderOnDueDate: true,
        reminder1DayOverdue: true,
        reminder3DaysOverdue: true,
        reminder7DaysOverdue: false,
        customReminderDays: [],
        language: 'en',
        voiceGender: 'female',
        smartMode: true,
        manualChannel: 'voice',
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      };
      
      const result = isWithinBusinessHours(settings);
      
      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('outside business hours');
      
      vi.useRealTimers();
    });
    
    it('should return false if on weekend', () => {
      // Mock current time to be on Saturday
      const mockDate = new Date('2024-01-13T14:00:00Z'); // Saturday 2 PM UTC
      vi.setSystemTime(mockDate);
      
      const settings: ReminderSettings = {
        userId: 'user-1',
        organizationId: 'org-1',
        callTimezone: 'UTC',
        callStartTime: '09:00:00',
        callEndTime: '18:00:00',
        callDaysOfWeek: [1, 2, 3, 4, 5], // Weekdays only
        reminder30DaysBefore: false,
        reminder15DaysBefore: false,
        reminder7DaysBefore: true,
        reminder5DaysBefore: false,
        reminder3DaysBefore: true,
        reminder1DayBefore: true,
        reminderOnDueDate: true,
        reminder1DayOverdue: true,
        reminder3DaysOverdue: true,
        reminder7DaysOverdue: false,
        customReminderDays: [],
        language: 'en',
        voiceGender: 'female',
        smartMode: true,
        manualChannel: 'voice',
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      };
      
      const result = isWithinBusinessHours(settings);
      
      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('not in allowed days');
      
      vi.useRealTimers();
    });
  });
  
  describe('canRetryNow', () => {
    it('should return true if no previous attempt', () => {
      const result = canRetryNow(null, 2);
      
      expect(result.canRetry).toBe(true);
    });
    
    it('should return true if retry delay has passed', () => {
      const lastAttempt = new Date('2024-01-15T10:00:00Z');
      const now = new Date('2024-01-15T12:30:00Z'); // 2.5 hours later
      vi.setSystemTime(now);
      
      const result = canRetryNow(lastAttempt, 2);
      
      expect(result.canRetry).toBe(true);
      
      vi.useRealTimers();
    });
    
    it('should return false if retry delay has not passed', () => {
      const lastAttempt = new Date('2024-01-15T10:00:00Z');
      const now = new Date('2024-01-15T11:30:00Z'); // 1.5 hours later
      vi.setSystemTime(now);
      
      const result = canRetryNow(lastAttempt, 2);
      
      expect(result.canRetry).toBe(false);
      expect(result.reason).toContain('Minimum retry delay');
      expect(result.nextRetryTime).toBeDefined();
      
      vi.useRealTimers();
    });
  });
  
  describe('hasAttemptsRemaining', () => {
    it('should return true if attempts remaining', () => {
      const result = hasAttemptsRemaining(2, 3);
      
      expect(result.canRetry).toBe(true);
    });
    
    it('should return false if max attempts reached', () => {
      const result = hasAttemptsRemaining(3, 3);
      
      expect(result.canRetry).toBe(false);
      expect(result.reason).toContain('Maximum retry attempts');
    });
    
    it('should return false if max attempts exceeded', () => {
      const result = hasAttemptsRemaining(4, 3);
      
      expect(result.canRetry).toBe(false);
      expect(result.reason).toContain('Maximum retry attempts');
    });
  });
  
  describe('cancelPendingReminders', () => {
    it('should cancel all pending reminders for an invoice', async () => {
      const { db } = await import('@/db/drizzle');
      
      // Mock database update and select
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'reminder-1' },
            { id: 'reminder-2' },
          ]),
        }),
      });
      
      (db.update as unknown as ReturnType<typeof vi.fn>) = mockUpdate;
      (db.select as unknown as ReturnType<typeof vi.fn>) = mockSelect;
      
      const count = await cancelPendingReminders('invoice-1');
      
      expect(count).toBe(2);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
  
  describe('canSendReminder', () => {
    it('should return true if all checks pass', () => {
      // Mock current time to be within business hours
      const mockDate = new Date('2024-01-15T14:00:00Z'); // Monday 2 PM UTC
      vi.setSystemTime(mockDate);
      
      const reminder = {
        attemptCount: 1,
        lastAttemptAt: new Date('2024-01-15T10:00:00Z'), // 4 hours ago
      };
      
      const settings: ReminderSettings = {
        userId: 'user-1',
        organizationId: 'org-1',
        callTimezone: 'UTC',
        callStartTime: '09:00:00',
        callEndTime: '18:00:00',
        callDaysOfWeek: [1, 2, 3, 4, 5],
        reminder30DaysBefore: false,
        reminder15DaysBefore: false,
        reminder7DaysBefore: true,
        reminder5DaysBefore: false,
        reminder3DaysBefore: true,
        reminder1DayBefore: true,
        reminderOnDueDate: true,
        reminder1DayOverdue: true,
        reminder3DaysOverdue: true,
        reminder7DaysOverdue: false,
        customReminderDays: [],
        language: 'en',
        voiceGender: 'female',
        smartMode: true,
        manualChannel: 'voice',
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      };
      
      const result = canSendReminder(reminder, settings);
      
      expect(result.canSend).toBe(true);
      
      vi.useRealTimers();
    });
    
    it('should return false if outside business hours', () => {
      // Mock current time to be outside business hours
      const mockDate = new Date('2024-01-15T20:00:00Z'); // Monday 8 PM UTC
      vi.setSystemTime(mockDate);
      
      const reminder = {
        attemptCount: 1,
        lastAttemptAt: new Date('2024-01-15T10:00:00Z'),
      };
      
      const settings: ReminderSettings = {
        userId: 'user-1',
        organizationId: 'org-1',
        callTimezone: 'UTC',
        callStartTime: '09:00:00',
        callEndTime: '18:00:00',
        callDaysOfWeek: [1, 2, 3, 4, 5],
        reminder30DaysBefore: false,
        reminder15DaysBefore: false,
        reminder7DaysBefore: true,
        reminder5DaysBefore: false,
        reminder3DaysBefore: true,
        reminder1DayBefore: true,
        reminderOnDueDate: true,
        reminder1DayOverdue: true,
        reminder3DaysOverdue: true,
        reminder7DaysOverdue: false,
        customReminderDays: [],
        language: 'en',
        voiceGender: 'female',
        smartMode: true,
        manualChannel: 'voice',
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      };
      
      const result = canSendReminder(reminder, settings);
      
      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('outside business hours');
      
      vi.useRealTimers();
    });
    
    it('should return false if max attempts reached', () => {
      // Mock current time to be within business hours
      const mockDate = new Date('2024-01-15T14:00:00Z');
      vi.setSystemTime(mockDate);
      
      const reminder = {
        attemptCount: 3,
        lastAttemptAt: new Date('2024-01-15T10:00:00Z'),
      };
      
      const settings: ReminderSettings = {
        userId: 'user-1',
        organizationId: 'org-1',
        callTimezone: 'UTC',
        callStartTime: '09:00:00',
        callEndTime: '18:00:00',
        callDaysOfWeek: [1, 2, 3, 4, 5],
        reminder30DaysBefore: false,
        reminder15DaysBefore: false,
        reminder7DaysBefore: true,
        reminder5DaysBefore: false,
        reminder3DaysBefore: true,
        reminder1DayBefore: true,
        reminderOnDueDate: true,
        reminder1DayOverdue: true,
        reminder3DaysOverdue: true,
        reminder7DaysOverdue: false,
        customReminderDays: [],
        language: 'en',
        voiceGender: 'female',
        smartMode: true,
        manualChannel: 'voice',
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      };
      
      const result = canSendReminder(reminder, settings);
      
      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('Maximum retry attempts');
      
      vi.useRealTimers();
    });
  });
});
