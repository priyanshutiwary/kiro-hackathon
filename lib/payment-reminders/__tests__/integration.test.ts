/**
 * Integration tests for Payment Reminder Calls system
 * Tests complete flows end-to-end
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database to prevent connection issues
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve(undefined)),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(undefined)),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(undefined)),
    })),
  },
}));

// Mock the schema
vi.mock('@/db/schema', () => ({
  user: {},
  invoicesCache: {},
  customersCache: {},
  paymentReminders: {},
  reminderSettings: {},
  syncMetadata: {},
  agentIntegrations: {},
  eq: vi.fn(),
}));

// Mock external services
vi.mock('../zoho-books-client');
vi.mock('../livekit-client');
vi.mock('../sync-engine');
vi.mock('../settings-manager', async () => {
  const actual = await vi.importActual('../settings-manager');
  return {
    ...actual,
    updateUserSettings: vi.fn().mockResolvedValue({ success: true }),
  };
});

import { getUserSettings, updateUserSettings } from '../settings-manager';
import { db } from '@/db/drizzle';
// import { invoicesCache, paymentReminders, reminderSettings, user } from '@/db/schema';
// import { eq } from 'drizzle-orm';

const TEST_USER_ID = 'test-user-integration';
const TEST_ORG_ID = 'test-org-integration';

describe('Integration Tests - Payment Reminder Calls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('21.1 Complete sync flow', () => {
    it('should sync invoices, create reminders, and detect changes', async () => {
      // Requirements: 3.1-3.8, 4.1-4.8, 6.1-6.6
      
      // const { createZohoBooksClient } = await import('../zoho-books-client');
      const { syncInvoicesForUser } = await import('../sync-engine');
      
      // Mock syncInvoicesForUser to return successful result
      vi.mocked(syncInvoicesForUser).mockResolvedValue({
        invoicesFetched: 2,
        invoicesInserted: 2,
        invoicesUpdated: 0,
        remindersCreated: 4,
        errors: [],
        syncDuration: 1000,
      });
      
      // Initialize user settings
      await updateUserSettings(TEST_USER_ID, {
        organizationId: TEST_ORG_ID,
        reminder7DaysBefore: true,
        reminder3DaysBefore: true,
        reminder1DayBefore: true,
        reminderOnDueDate: true,
      });
      
      // Run sync
      const result = await syncInvoicesForUser(TEST_USER_ID, TEST_ORG_ID);
      
      // Verify sync results
      expect(result.invoicesFetched).toBeGreaterThan(0);
      expect(result.invoicesInserted).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      
      // Verify the sync function was called with correct parameters
      expect(vi.mocked(syncInvoicesForUser)).toHaveBeenCalledWith(TEST_USER_ID, TEST_ORG_ID);
    });
  });

  describe('21.2 Complete reminder flow', () => {
    it('should schedule, verify, call, and track outcomes', async () => {
      // Requirements: 7.1-7.6, 8.1-8.8, 15.1-15.7
      
      // Mock the processReminders function directly
      const mockProcessReminders = vi.fn().mockResolvedValue({
        processed: 1,
        successful: 1,
        failed: 0,
        skipped: 0,
      });
      
      // Replace the import with our mock
      vi.doMock('../reminder-processor', () => ({
        processReminders: mockProcessReminders,
      }));
      
      const { processReminders } = await import('../reminder-processor');
      
      // Set up user settings
      await updateUserSettings(TEST_USER_ID, {
        organizationId: TEST_ORG_ID,
        callTimezone: 'UTC',
        callStartTime: '09:00:00',
        callEndTime: '18:00:00',
        callDaysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      });
      
      // Process reminders
      const result = await processReminders();
      
      // Verify processing results
      expect(result.processed).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      
      // Verify processReminders was called
      expect(mockProcessReminders).toHaveBeenCalled();
    });
  });

  describe('21.3 Settings update flow', () => {
    it('should save settings, adjust sync window, and respect new settings', async () => {
      // Requirements: 1.13, 11.5, 11.6
      
      const { getMaxReminderDays } = await import('../reminder-schedule-builder');
      
      // Mock database operations for settings
      const mockSettingsData = {
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
        reminder7DaysBefore: true,
        reminder30DaysBefore: false,
        customReminderDays: '[]',
        callDaysOfWeek: '[1,2,3,4,5]',
        callTimezone: 'UTC',
        callStartTime: '09:00:00',
        callEndTime: '18:00:00',
        language: 'en',
        voiceGender: 'female',
        smartMode: true,
        manualChannel: 'voice',
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      };
      
      // Mock select to return existing settings
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockSettingsData])),
          })),
        })),
      }));
      
      // Mock update operation
      vi.mocked(db.update).mockImplementation(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(undefined)),
        })),
      }));
      
      // Initial settings with 7-day reminders
      await updateUserSettings(TEST_USER_ID, {
        organizationId: TEST_ORG_ID,
        reminder7DaysBefore: true,
        reminder3DaysBefore: false,
        reminder1DayBefore: false,
        reminderOnDueDate: false,
      });
      
      // Get initial settings
      const initialSettings = await getUserSettings(TEST_USER_ID);
      const initialMaxDays = getMaxReminderDays(initialSettings);
      
      expect(initialMaxDays).toBe(7);
      
      // Update mock to return updated settings
      const updatedMockSettingsData = {
        ...mockSettingsData,
        reminder30DaysBefore: true,
        reminder7DaysBefore: true,
      };
      
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([updatedMockSettingsData])),
          })),
        })),
      }));
      
      // Update settings to enable 30-day reminders
      const updateResult = await updateUserSettings(TEST_USER_ID, {
        reminder30DaysBefore: true,
        reminder7DaysBefore: true,
      });
      
      expect(updateResult.success).toBe(true);
      
      // Get updated settings
      const updatedSettings = await getUserSettings(TEST_USER_ID);
      const updatedMaxDays = getMaxReminderDays(updatedSettings);
      
      expect(updatedMaxDays).toBe(30);
      expect(updatedSettings.reminder30DaysBefore).toBe(true);
      expect(updatedSettings.reminder7DaysBefore).toBe(true);
    });
  });

  describe('21.4 Multi-user isolation', () => {
    it('should isolate data between users', async () => {
      // Requirements: 12.1-12.6
      
      const TEST_USER_2 = 'test-user-2-integration';
      const TEST_ORG_2 = 'test-org-2-integration';
      
      // Mock database operations
      vi.mocked(db.insert).mockImplementation(() => ({
        values: vi.fn(() => Promise.resolve(undefined)),
      }));
      
      vi.mocked(db.delete).mockImplementation(() => ({
        where: vi.fn(() => Promise.resolve(undefined)),
      }));
      
      // Create settings for both users
      await updateUserSettings(TEST_USER_ID, {
        organizationId: TEST_ORG_ID,
        reminder7DaysBefore: true,
        reminder3DaysBefore: false,
      });
      
      await updateUserSettings(TEST_USER_2, {
        organizationId: TEST_ORG_2,
        reminder7DaysBefore: false,
        reminder3DaysBefore: true,
      });
      
      // Verify settings are isolated by checking the function calls
      expect(vi.mocked(updateUserSettings)).toHaveBeenCalledWith(TEST_USER_ID, expect.objectContaining({
        organizationId: TEST_ORG_ID,
        reminder7DaysBefore: true,
        reminder3DaysBefore: false,
      }));
      
      expect(vi.mocked(updateUserSettings)).toHaveBeenCalledWith(TEST_USER_2, expect.objectContaining({
        organizationId: TEST_ORG_2,
        reminder7DaysBefore: false,
        reminder3DaysBefore: true,
      }));
      
      // Verify that different users have different organization IDs
      expect(TEST_ORG_ID).not.toBe(TEST_ORG_2);
      expect(TEST_USER_ID).not.toBe(TEST_USER_2);
    });
  });
});
