/**
 * Tests for unified reminder executor
 * 
 * Tests the channel-based routing logic in reminder-executor.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/db/drizzle';

// Mock dependencies before imports
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../sms-executor', () => ({
  executeSMSReminder: vi.fn(),
}));

vi.mock('../pre-call-verification', () => ({
  verifyInvoiceStatus: vi.fn(),
  prepareFreshContext: vi.fn(),
}));

vi.mock('../livekit-client', () => ({
  makeCall: vi.fn(),
}));

// Import after mocks
const { executeReminder } = await import('../reminder-executor');
const { executeSMSReminder } = await import('../sms-executor');

describe('executeReminder - Channel Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should route SMS channel to executeSMSReminder', async () => {
    // Mock reminder with SMS channel
    const mockReminder = {
      id: 'reminder-1',
      channel: 'sms',
      userId: 'user-1',
      invoiceId: 'invoice-1',
      reminderType: '7_days_before',
      status: 'pending',
      attemptCount: 0,
    };

    const mockSMSResult = {
      success: true,
      messageSid: 'SM123456',
    };

    // Mock database query
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockReminder]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    // Mock SMS executor
    vi.mocked(executeSMSReminder).mockResolvedValue(mockSMSResult);

    // Execute
    const result = await executeReminder('reminder-1');

    // Verify routing
    expect(result.channel).toBe('sms');
    expect(executeSMSReminder).toHaveBeenCalledWith('reminder-1');
    if (result.channel === 'sms') {
      expect(result.result).toEqual(mockSMSResult);
    }
  });

  it('should handle unknown channel type with error', async () => {
    // Mock reminder with unknown channel
    const mockReminder = {
      id: 'reminder-3',
      channel: 'telegram', // Unknown channel
      userId: 'user-1',
      invoiceId: 'invoice-1',
      reminderType: '3_days_before',
      status: 'pending',
      attemptCount: 0,
    };

    // Mock database query
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockReminder]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    // Mock database update
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    vi.mocked(db.update).mockReturnValue(mockUpdate() as unknown as ReturnType<typeof db.update>);

    // Execute
    const result = await executeReminder('reminder-3');

    // Verify error handling
    expect(result.channel).toBe('unknown');
    if (result.channel === 'unknown') {
      expect(result.error).toContain('Unknown channel type: telegram');
    }

    // Verify reminder was marked as failed
    expect(db.update).toHaveBeenCalled();
  });

  it('should throw error when reminder not found', async () => {
    // Mock empty result
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    // Execute and expect error
    await expect(executeReminder('non-existent')).rejects.toThrow('Reminder not found: non-existent');
  });
});
