/**
 * Integration tests for Payment Reminder Calls system
 * Tests complete flows end-to-end
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/db/drizzle';
import { user, invoicesCache, paymentReminders, reminderSettings, syncMetadata } from '@/db/schema';
import { eq} from 'drizzle-orm';

import { getUserSettings, updateUserSettings } from '../settings-manager';


// Mock external services
vi.mock('../zoho-books-client');
vi.mock('../livekit-client');

const TEST_USER_ID = 'test-user-integration';
const TEST_ORG_ID = 'test-org-integration';

describe('Integration Tests - Payment Reminder Calls', () => {
  beforeEach(async () => {
    // Create test user first (required for foreign key constraints)
    try {
      await db.insert(user).values({
        id: TEST_USER_ID,
        name: 'Test User',
        email: 'test-integration@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (_error) {
      // User might already exist, that's okay
    }
    
    // Clean up test data
    await db.delete(paymentReminders).where(eq(paymentReminders.userId, TEST_USER_ID));
    await db.delete(invoicesCache).where(eq(invoicesCache.userId, TEST_USER_ID));
    await db.delete(reminderSettings).where(eq(reminderSettings.userId, TEST_USER_ID));
    await db.delete(syncMetadata).where(eq(syncMetadata.userId, TEST_USER_ID));
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(paymentReminders).where(eq(paymentReminders.userId, TEST_USER_ID));
    await db.delete(invoicesCache).where(eq(invoicesCache.userId, TEST_USER_ID));
    await db.delete(reminderSettings).where(eq(reminderSettings.userId, TEST_USER_ID));
    await db.delete(syncMetadata).where(eq(syncMetadata.userId, TEST_USER_ID));
    // Don't delete the user - it might be used by other tests
    vi.clearAllMocks();
  });

  describe('21.1 Complete sync flow', () => {
    it('should sync invoices, create reminders, and detect changes', async () => {
      // Requirements: 3.1-3.8, 4.1-4.8, 6.1-6.6
      
      const { createZohoBooksClient } = await import('../zoho-books-client');
      const { syncInvoicesForUser } = await import('../sync-engine');
      
      // Create mock Zoho client
      const mockGetInvoices = vi.fn().mockImplementation(async (userId, filters) => {
        // Return mock invoices based on filters
        if (filters.dueDateMax && filters.dueDateMax < new Date()) {
          // Overdue invoices
          return [
            {
              invoice_id: 'INV-OVERDUE-001',
              customer_id: 'CUST-001',
              customer_name: 'Overdue Customer',
              customer_phone: '+1234567890',
              invoice_number: 'INV-OVERDUE-001',
              total: 500.00,
              balance: 500.00,
              due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
              status: 'unpaid',
              last_modified_time: new Date().toISOString(),
            },
          ];
        }
        
        // Regular invoices within sync window
        return [
          {
            invoice_id: 'INV-001',
            customer_id: 'CUST-001',
            customer_name: 'Test Customer',
            customer_phone: '+1234567890',
            invoice_number: 'INV-001',
            total: 1000.00,
            balance: 1000.00,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            status: 'unpaid',
            last_modified_time: new Date().toISOString(),
          },
        ];
      });
      
      const mockZohoClient = {
        getInvoices: mockGetInvoices,
        getInvoiceById: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      
      // Mock the createZohoBooksClient function
      vi.mocked(createZohoBooksClient).mockReturnValue(mockZohoClient);
      
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
      
      // Verify invoices were inserted
      const invoices = await db
        .select()
        .from(invoicesCache)
        .where(eq(invoicesCache.userId, TEST_USER_ID));
      
      expect(invoices.length).toBeGreaterThan(0);
      
      // Verify reminders were created
      const reminders = await db
        .select()
        .from(paymentReminders)
        .where(eq(paymentReminders.userId, TEST_USER_ID));
      
      expect(reminders.length).toBeGreaterThan(0);
      
      // Verify all reminders are in the future or today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const reminder of reminders) {
        const scheduledDate = new Date(reminder.scheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);
        expect(scheduledDate >= today).toBe(true);
      }
    });
  });

  describe('21.2 Complete reminder flow', () => {
    it('should schedule, verify, call, and track outcomes', async () => {
      // Requirements: 7.1-7.6, 8.1-8.8, 15.1-15.7
      
      const { processReminders } = await import('../reminder-scheduler');
      const livekitClient = await import('../livekit-client');
      const zohoClient = await import('../zoho-books-client');
      
      // Mock LiveKit client to simulate successful call
      vi.spyOn(livekitClient, 'makeCall').mockResolvedValue({
        connected: true,
        duration: 120,
        customerResponse: 'will_pay_today',
        notes: 'Customer confirmed payment',
        livekitCallId: 'call-123',
      });
      
      // Mock Zoho client for pre-call verification
      const mockGetInvoiceById = vi.fn().mockResolvedValue({
        invoice_id: 'INV-TEST-001',
        customer_id: 'CUST-001',
        customer_name: 'Test Customer',
        customer_phone: '+1234567890',
        invoice_number: 'INV-TEST-001',
        total: 1000.00,
        balance: 1000.00,
        due_date: new Date().toISOString(),
        status: 'unpaid',
        last_modified_time: new Date().toISOString(),
      });
      
      vi.spyOn(zohoClient, 'createZohoBooksClient').mockReturnValue({
        getInvoiceById: mockGetInvoiceById,
        getInvoices: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      
      // Set up user settings with call window that allows calls now
      const now = new Date();
      const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      await updateUserSettings(TEST_USER_ID, {
        organizationId: TEST_ORG_ID,
        callTimezone: 'UTC',
        callStartTime: `${startTime.getUTCHours().toString().padStart(2, '0')}:00:00`,
        callEndTime: `${endTime.getUTCHours().toString().padStart(2, '0')}:00:00`,
        callDaysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
        maxRetryAttempts: 3,
        retryDelayHours: 2,
      });
      
      // Create a test invoice
      const invoiceId = crypto.randomUUID();
      await db.insert(invoicesCache).values({
        id: invoiceId,
        userId: TEST_USER_ID,
        zohoInvoiceId: 'INV-TEST-001',
        customerId: null, // No customer reference for this test
        customerName: 'Test Customer',
        customerPhone: '+1234567890',
        customerCountryCode: null,
        customerTimezone: null,
        invoiceNumber: 'INV-TEST-001',
        amountTotal: '1000.00',
        amountDue: '1000.00',
        dueDate: new Date(),
        status: 'unpaid',
        zohoLastModifiedAt: new Date(),
        localLastSyncedAt: new Date(),
        syncHash: 'test-hash',
        remindersCreated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      
      // Create a due reminder
      const reminderId = crypto.randomUUID();
      await db.insert(paymentReminders).values({
        id: reminderId,
        invoiceId,
        userId: TEST_USER_ID,
        reminderType: 'on_due_date',
        scheduledDate: new Date(), // Due today
        status: 'pending',
        attemptCount: 0,
        lastAttemptAt: null,
        callOutcome: null,
        skipReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Process reminders
      await processReminders();
      
      // Verify reminder was processed
      const processedReminder = await db
        .select()
        .from(paymentReminders)
        .where(eq(paymentReminders.id, reminderId))
        .limit(1);
      
      expect(processedReminder.length).toBe(1);
      expect(processedReminder[0].status).toBe('completed');
      expect(processedReminder[0].attemptCount).toBe(1);
      expect(processedReminder[0].callOutcome).toBeTruthy();
      
      // Verify call was made
      expect(livekitClient.makeCall).toHaveBeenCalled();
      
      // Verify Zoho verification was called
      expect(mockGetInvoiceById).toHaveBeenCalledWith(TEST_USER_ID, 'INV-TEST-001');
    });
  });

  describe('21.3 Settings update flow', () => {
    it('should save settings, adjust sync window, and respect new settings', async () => {
      // Requirements: 1.13, 11.5, 11.6
      
      const { getMaxReminderDays } = await import('../reminder-schedule');
      
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
      
      // Verify settings persist across reads
      const reloadedSettings = await getUserSettings(TEST_USER_ID);
      expect(reloadedSettings.reminder30DaysBefore).toBe(true);
      expect(reloadedSettings.reminder7DaysBefore).toBe(true);
    });
  });

  describe('21.4 Multi-user isolation', () => {
    it('should isolate data between users', async () => {
      // Requirements: 12.1-12.6
      
      const TEST_USER_2 = 'test-user-2-integration';
      const TEST_ORG_2 = 'test-org-2-integration';
      
      try {
        // Create second test user
        try {
          await db.insert(user).values({
            id: TEST_USER_2,
            name: 'Test User 2',
            email: 'test-integration-2@example.com',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (_error) {
          // User might already exist, that's okay
        }
        
        // Create settings for both users
        await updateUserSettings(TEST_USER_ID, {
          organizationId: TEST_ORG_ID,
          reminder7DaysBefore: true,
          reminder3DaysBefore: false, // Explicitly set to false
        });
        
        await updateUserSettings(TEST_USER_2, {
          organizationId: TEST_ORG_2,
          reminder7DaysBefore: false, // Explicitly set to false
          reminder3DaysBefore: true,
        });
        
        // Create invoices for both users
        const invoice1Id = crypto.randomUUID();
        await db.insert(invoicesCache).values({
          id: invoice1Id,
          userId: TEST_USER_ID,
          zohoInvoiceId: 'INV-USER1-001',
          customerId: null, // No customer reference for this test
          customerName: 'User 1 Customer',
          customerPhone: '+1111111111',
          customerCountryCode: null,
          customerTimezone: null,
          invoiceNumber: 'INV-USER1-001',
          amountTotal: '1000.00',
          amountDue: '1000.00',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'unpaid',
          zohoLastModifiedAt: new Date(),
          localLastSyncedAt: new Date(),
          syncHash: 'hash-user1',
          remindersCreated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        
        const invoice2Id = crypto.randomUUID();
        await db.insert(invoicesCache).values({
          id: invoice2Id,
          userId: TEST_USER_2,
          zohoInvoiceId: 'INV-USER2-001',
          customerId: null, // No customer reference for this test
          customerName: 'User 2 Customer',
          customerPhone: '+2222222222',
          customerCountryCode: null,
          customerTimezone: null,
          invoiceNumber: 'INV-USER2-001',
          amountTotal: '2000.00',
          amountDue: '2000.00',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'unpaid',
          zohoLastModifiedAt: new Date(),
          localLastSyncedAt: new Date(),
          syncHash: 'hash-user2',
          remindersCreated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        
        // Create reminders for both users
        await db.insert(paymentReminders).values({
          id: crypto.randomUUID(),
          invoiceId: invoice1Id,
          userId: TEST_USER_ID,
          reminderType: '7_days_before',
          scheduledDate: new Date(),
          status: 'pending',
          attemptCount: 0,
          lastAttemptAt: null,
          callOutcome: null,
          skipReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        await db.insert(paymentReminders).values({
          id: crypto.randomUUID(),
          invoiceId: invoice2Id,
          userId: TEST_USER_2,
          reminderType: '3_days_before',
          scheduledDate: new Date(),
          status: 'pending',
          attemptCount: 0,
          lastAttemptAt: null,
          callOutcome: null,
          skipReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Verify user 1 can only see their own data
        const user1Invoices = await db
          .select()
          .from(invoicesCache)
          .where(eq(invoicesCache.userId, TEST_USER_ID));
        
        expect(user1Invoices.length).toBe(1);
        expect(user1Invoices[0].zohoInvoiceId).toBe('INV-USER1-001');
        
        const user1Reminders = await db
          .select()
          .from(paymentReminders)
          .where(eq(paymentReminders.userId, TEST_USER_ID));
        
        expect(user1Reminders.length).toBe(1);
        expect(user1Reminders[0].reminderType).toBe('7_days_before');
        
        // Verify user 2 can only see their own data
        const user2Invoices = await db
          .select()
          .from(invoicesCache)
          .where(eq(invoicesCache.userId, TEST_USER_2));
        
        expect(user2Invoices.length).toBe(1);
        expect(user2Invoices[0].zohoInvoiceId).toBe('INV-USER2-001');
        
        const user2Reminders = await db
          .select()
          .from(paymentReminders)
          .where(eq(paymentReminders.userId, TEST_USER_2));
        
        expect(user2Reminders.length).toBe(1);
        expect(user2Reminders[0].reminderType).toBe('3_days_before');
        
        // Verify settings are isolated
        const user1Settings = await getUserSettings(TEST_USER_ID);
        const user2Settings = await getUserSettings(TEST_USER_2);
        
        expect(user1Settings.reminder7DaysBefore).toBe(true);
        expect(user1Settings.reminder3DaysBefore).toBe(false);
        
        expect(user2Settings.reminder7DaysBefore).toBe(false);
        expect(user2Settings.reminder3DaysBefore).toBe(true);
        
      } finally {
        // Clean up user 2 data
        await db.delete(paymentReminders).where(eq(paymentReminders.userId, TEST_USER_2));
        await db.delete(invoicesCache).where(eq(invoicesCache.userId, TEST_USER_2));
        await db.delete(reminderSettings).where(eq(reminderSettings.userId, TEST_USER_2));
      }
    });
  });
});
