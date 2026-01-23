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
interface _MockSession {
  session: { userId: string };
  user: { id: string };
}

interface MockQuery {
  from: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
}

describe('GET /api/reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/reminders');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return reminders with channel information', async () => {
    const mockUserId = 'user-123';
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { userId: mockUserId },
      user: { id: mockUserId },
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const mockReminders = [
      {
        id: 'reminder-1',
        reminderType: '7_days_before',
        scheduledDate: new Date('2024-01-15'),
        status: 'completed',
        channel: 'sms',
        externalId: 'SM123456',
        attemptCount: 1,
        lastAttemptAt: new Date('2024-01-15T10:00:00Z'),
        callOutcome: JSON.stringify({ customerResponse: 'will_pay_today' }),
        skipReason: null,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-15'),
        invoice: {
          id: 'inv-1',
          zohoInvoiceId: 'zoho-inv-1',
          invoiceNumber: 'INV-001',
          amountTotal: '1000.00',
          amountDue: '1000.00',
          currencyCode: 'USD',
          dueDate: new Date('2024-01-22'),
          status: 'sent',
        },
        customer: {
          name: 'John Doe',
          phone: '+1234567890',
        },
      },
      {
        id: 'reminder-2',
        reminderType: '1_day_before',
        scheduledDate: new Date('2024-01-21'),
        status: 'pending',
        channel: 'voice',
        externalId: null,
        attemptCount: 0,
        lastAttemptAt: null,
        callOutcome: null,
        skipReason: null,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08'),
        invoice: {
          id: 'inv-1',
          zohoInvoiceId: 'zoho-inv-1',
          invoiceNumber: 'INV-001',
          amountTotal: '1000.00',
          amountDue: '1000.00',
          currencyCode: 'USD',
          dueDate: new Date('2024-01-22'),
          status: 'sent',
        },
        customer: {
          name: 'John Doe',
          phone: '+1234567890',
        },
      },
    ];

    vi.mocked(db.select).mockImplementation(() => {
      const mockQuery: MockQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockReminders),
      };
      return mockQuery as unknown as ReturnType<typeof db.select>;
    });

    const request = new Request('http://localhost/api/reminders');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reminders).toHaveLength(2);
    expect(data.count).toBe(2);

    // Check first reminder (SMS)
    expect(data.reminders[0].channel).toBe('sms');
    expect(data.reminders[0].externalId).toBe('SM123456');
    expect(data.reminders[0].status).toBe('completed');

    // Check second reminder (Voice)
    expect(data.reminders[1].channel).toBe('voice');
    expect(data.reminders[1].externalId).toBeNull();
    expect(data.reminders[1].status).toBe('pending');
  });

  it('should filter reminders by status', async () => {
    const mockUserId = 'user-123';
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { userId: mockUserId },
      user: { id: mockUserId },
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const mockReminders = [
      {
        id: 'reminder-1',
        reminderType: '7_days_before',
        scheduledDate: new Date('2024-01-15'),
        status: 'completed',
        channel: 'sms',
        externalId: 'SM123456',
        attemptCount: 1,
        lastAttemptAt: new Date('2024-01-15T10:00:00Z'),
        callOutcome: null,
        skipReason: null,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-15'),
        invoice: {
          id: 'inv-1',
          zohoInvoiceId: 'zoho-inv-1',
          invoiceNumber: 'INV-001',
          amountTotal: '1000.00',
          amountDue: '1000.00',
          currencyCode: 'USD',
          dueDate: new Date('2024-01-22'),
          status: 'sent',
        },
        customer: {
          name: 'John Doe',
          phone: '+1234567890',
        },
      },
    ];

    vi.mocked(db.select).mockImplementation(() => {
      const mockQuery: MockQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockReminders),
      };
      return mockQuery as unknown as ReturnType<typeof db.select>;
    });

    const request = new Request('http://localhost/api/reminders?status=completed');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reminders).toHaveLength(1);
    expect(data.reminders[0].status).toBe('completed');
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

    const request = new Request('http://localhost/api/reminders');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch reminders');
  });
});
