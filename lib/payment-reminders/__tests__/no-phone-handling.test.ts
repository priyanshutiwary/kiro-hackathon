/**
 * Tests for handling invoices without phone numbers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/db/drizzle';
import { invoicesCache, paymentReminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createRemindersForInvoice } from '../sync-engine';
import { initiateCall } from '../call-executor';
import { ReminderSettings } from '../settings-manager';

// Mock the database
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('No Phone Number Handling', () => {
  const mockSettings: ReminderSettings = {
    enabled: true,
    reminderDays: [5, 1],
    callWindowStart: '09:00',
    callWindowEnd: '17:00',
    timezone: 'America/New_York',
    maxRetryAttempts: 3,
    retryDelayHours: 24,
    organizationId: 'test-org',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRemindersForInvoice', () => {
    it('should skip creating reminders for invoices without phone numbers', async () => {
      const invoiceId = 'test-invoice-id';
      const userId = 'test-user-id';
      const dueDate = new Date('2024-12-31');

      // Mock invoice without phone number
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                customerPhone: null, // No phone number
                invoiceNumber: 'INV-001',
              },
            ]),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.update as any).mockImplementation(mockUpdate);

      await createRemindersForInvoice(invoiceId, userId, dueDate, mockSettings);

      // Should mark invoice as processed but not create reminders
      expect(mockUpdate).toHaveBeenCalledWith(invoicesCache);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should create reminders for invoices with phone numbers', async () => {
      const invoiceId = 'test-invoice-id';
      const userId = 'test-user-id';
      const dueDate = new Date('2024-12-31');

      // Mock invoice with phone number
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                customerPhone: '+1234567890',
                invoiceNumber: 'INV-001',
              },
            ]),
          }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockImplementation(mockInsert);
      (db.update as any).mockImplementation(mockUpdate);

      await createRemindersForInvoice(invoiceId, userId, dueDate, mockSettings);

      // Should create reminders and mark as processed
      expect(mockInsert).toHaveBeenCalledWith(paymentReminders);
      expect(mockUpdate).toHaveBeenCalledWith(invoicesCache);
    });
  });

  describe('initiateCall', () => {
    it('should return no_phone_number outcome instead of throwing error', async () => {
      const reminderId = 'test-reminder-id';

      // Mock reminder
      const mockReminderSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: reminderId,
                invoiceId: 'test-invoice-id',
                userId: 'test-user-id',
                reminderType: '5_days_before',
                attemptCount: 0,
              },
            ]),
          }),
        }),
      });

      // Mock invoice without phone number
      const mockInvoiceSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'test-invoice-id',
                userId: 'test-user-id',
                zohoInvoiceId: 'zoho-123',
                customerPhone: null, // No phone number
              },
            ]),
          }),
        }),
      });

      (db.select as any)
        .mockImplementationOnce(mockReminderSelect)
        .mockImplementationOnce(mockInvoiceSelect);

      const outcome = await initiateCall(reminderId);

      expect(outcome).toEqual({
        connected: false,
        duration: 0,
        customerResponse: 'no_phone_number',
        notes: 'Customer phone number missing - cannot make call',
      });
    });
  });
});