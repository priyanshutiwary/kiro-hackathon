/**
 * Tests for handling invoices without phone numbers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRemindersForInvoice } from '../sync-engine';
import { initiateCall } from '../reminder-executor';
import { ReminderSettings } from '../settings-manager';

// Mock the database with proper query builder structure
const createMockQuery = (result: unknown[] = []) => {
  const mockQuery = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
  
  // Make all methods return the query object to support chaining
  mockQuery.from.mockReturnValue(mockQuery);
  mockQuery.leftJoin.mockReturnValue(mockQuery);
  mockQuery.where.mockReturnValue(mockQuery);
  
  return mockQuery;
};

vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(() => createMockQuery([])), // Default to empty array
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve(undefined)),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(undefined)),
      })),
    })),
  },
}));

// Mock the schema
vi.mock('@/db/schema', () => ({
  invoicesCache: {},
  customersCache: {},
  paymentReminders: {},
  eq: vi.fn(),
}));

import { db } from '@/db/drizzle';

describe('No Phone Number Handling', () => {
  const mockSettings: ReminderSettings = {
    userId: 'test-user-id',
    organizationId: 'test-org',
    reminder30DaysBefore: false,
    reminder15DaysBefore: false,
    reminder7DaysBefore: false,
    reminder5DaysBefore: true, // Enable 5-day reminder
    reminder3DaysBefore: false,
    reminder1DayBefore: true, // Enable 1-day reminder
    reminderOnDueDate: false,
    reminder1DayOverdue: false,
    reminder3DaysOverdue: false,
    reminder7DaysOverdue: false,
    customReminderDays: [],
    callTimezone: 'America/New_York',
    callStartTime: '09:00:00',
    callEndTime: '17:00:00',
    callDaysOfWeek: [1, 2, 3, 4, 5],
    language: 'en',
    voiceGender: 'female',
    smartMode: true,
    manualChannel: 'voice',
    maxRetryAttempts: 3,
    retryDelayHours: 24,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRemindersForInvoice', () => {
    it('should skip creating reminders for invoices without phone numbers', async () => {
      const invoiceId = 'test-invoice-id';
      const userId = 'test-user-id';
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Mock the query to return invoice without phone number
      const invoiceData = [
        {
          customerPhone: null, // No phone number
          invoiceNumber: 'INV-001',
          customerName: 'Test Customer',
          amountDue: 1000,
          currencyCode: 'USD',
          currencySymbol: '$',
        },
      ];
      
      vi.mocked(db.select).mockImplementation(() => createMockQuery(invoiceData));

      // Mock update
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet });

      await createRemindersForInvoice(invoiceId, userId, dueDate, mockSettings);

      // Should mark invoice as processed but not create reminders
      expect(vi.mocked(db.update)).toHaveBeenCalled();
      expect(vi.mocked(db.insert)).not.toHaveBeenCalled();
    });

    it('should create reminders for invoices with phone numbers', async () => {
      const invoiceId = 'test-invoice-id';
      const userId = 'test-user-id';
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Mock the query to return invoice with phone number and customer data
      const invoiceData = [
        {
          invoiceNumber: 'INV-001',
          customerId: 'customer-123',
          customerName: 'Test Customer',
          primaryPhone: '+1234567890',
        },
      ];
      
      // Set up the mock to return invoice data for the first call
      vi.mocked(db.select).mockImplementationOnce(() => createMockQuery(invoiceData));
      
      // Mock subsequent calls (anti-spam checks) to return empty arrays
      vi.mocked(db.select).mockImplementation(() => createMockQuery([]));

      // Mock insert
      const mockValues = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({ values: mockValues });

      // Mock update
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet });

      await createRemindersForInvoice(invoiceId, userId, dueDate, mockSettings);

      // Should create reminders and mark as processed
      expect(vi.mocked(db.insert)).toHaveBeenCalled();
      expect(vi.mocked(db.update)).toHaveBeenCalled();
    });
  });

  describe('initiateCall', () => {
    it('should return no_phone_number outcome instead of throwing error', async () => {
      const reminderId = 'test-reminder-id';

      // Mock reminder data
      const mockReminderData = [
        {
          id: reminderId,
          invoiceId: 'test-invoice-id',
          userId: 'test-user-id',
          reminderType: '5_days_before',
          attemptCount: 0,
        },
      ];

      // Mock invoice data without phone number
      const mockInvoiceData = [
        {
          id: 'test-invoice-id',
          userId: 'test-user-id',
          zohoInvoiceId: 'zoho-123',
          customerPhone: null, // No phone number
          customerName: 'Test Customer',
          invoiceNumber: 'INV-001',
          amountDue: 1000,
          currencyCode: 'USD',
          currencySymbol: '$',
        },
      ];

      // Set up the select mock to return different results for different calls
      vi.mocked(db.select)
        .mockReturnValueOnce(createMockQuery(mockReminderData))
        .mockReturnValueOnce(createMockQuery(mockInvoiceData));

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