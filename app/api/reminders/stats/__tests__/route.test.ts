import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set up environment variables before any imports
process.env.DODO_PAYMENTS_API_KEY = 'test_key';
process.env.DATABASE_URL = 'postgresql://test';
process.env.BETTER_AUTH_SECRET = 'test_secret';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';

// Mock dependencies BEFORE importing the route
vi.mock('@/lib/auth');
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
  },
}));
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Import after mocks are set up
import { GET } from '../route';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';

// Type definitions for mocked data
interface _MockQuery {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
}

describe('GET /api/reminders/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return channel-specific statistics', async () => {
    const mockUserId = 'user-123';
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { userId: mockUserId },
      user: { id: mockUserId },
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    // Mock overall stats query
    const mockOverallStats = [
      { status: 'completed', count: 10 },
      { status: 'failed', count: 2 },
      { status: 'pending', count: 5 },
    ];

    // Mock channel stats query
    const mockChannelStats = [
      { channel: 'sms', status: 'completed', count: 6 },
      { channel: 'sms', status: 'failed', count: 1 },
      { channel: 'voice', status: 'completed', count: 4 },
      { channel: 'voice', status: 'failed', count: 1 },
      { channel: 'sms', status: 'pending', count: 3 },
      { channel: 'voice', status: 'pending', count: 2 },
    ];

    // Mock completed outcomes query
    const mockCompletedOutcomes = [
      { callOutcome: JSON.stringify({ customerResponse: 'will_pay_today' }) },
      { callOutcome: JSON.stringify({ customerResponse: 'already_paid' }) },
    ];

    // Mock type stats query
    const mockTypeStats = [
      { reminderType: '7_days_before', status: 'completed', count: 5 },
      { reminderType: '1_day_before', status: 'completed', count: 3 },
    ];

    // Mock db queries
    let queryCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      queryCount++;
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
      };

      // First query: overall stats
      if (queryCount === 1) {
        mockQuery.groupBy = vi.fn().mockResolvedValue(mockOverallStats);
      }
      // Second query: channel stats
      else if (queryCount === 2) {
        mockQuery.groupBy = vi.fn().mockResolvedValue(mockChannelStats);
      }
      // Third query: completed outcomes
      else if (queryCount === 3) {
        mockQuery.where = vi.fn().mockResolvedValue(mockCompletedOutcomes);
      }
      // Fourth query: type stats
      else if (queryCount === 4) {
        mockQuery.groupBy = vi.fn().mockResolvedValue(mockTypeStats);
      }

      return mockQuery as unknown as ReturnType<typeof db.select>;
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall).toBeDefined();
    expect(data.overall.total).toBe(17);
    expect(data.overall.completed).toBe(10);
    expect(data.overall.failed).toBe(2);
    expect(data.overall.pending).toBe(5);

    // Check channel statistics
    expect(data.byChannel).toBeDefined();
    expect(data.byChannel.smsCount).toBe(10); // 6 + 1 + 3
    expect(data.byChannel.voiceCount).toBe(7); // 4 + 1 + 2
    expect(data.byChannel.completedSMS).toBe(6);
    expect(data.byChannel.completedVoice).toBe(4);
    expect(data.byChannel.failedSMS).toBe(1);
    expect(data.byChannel.failedVoice).toBe(1);
  });

  it('should handle zero reminders gracefully', async () => {
    const mockUserId = 'user-123';
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { userId: mockUserId },
      user: { id: mockUserId },
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    // Mock empty results
    let queryCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      queryCount++;
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
      };

      // All queries return empty arrays
      if (queryCount <= 2) {
        mockQuery.groupBy = vi.fn().mockResolvedValue([]);
      } else if (queryCount === 3) {
        mockQuery.where = vi.fn().mockResolvedValue([]);
      } else {
        mockQuery.groupBy = vi.fn().mockResolvedValue([]);
      }

      return mockQuery as unknown as ReturnType<typeof db.select>;
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall.total).toBe(0);
    expect(data.byChannel.smsCount).toBe(0);
    expect(data.byChannel.voiceCount).toBe(0);
    expect(data.byChannel.completedSMS).toBe(0);
    expect(data.byChannel.completedVoice).toBe(0);
    expect(data.byChannel.failedSMS).toBe(0);
    expect(data.byChannel.failedVoice).toBe(0);
  });

  it('should handle database errors', async () => {
    const mockUserId = 'user-123';
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { userId: mockUserId },
      user: { id: mockUserId },
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch reminder statistics');
  });
});
