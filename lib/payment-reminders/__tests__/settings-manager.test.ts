/**
 * Tests for settings-manager validation functions
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database before importing settings-manager
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  reminderSettings: {
    userId: 'userId',
    organizationId: 'organizationId',
  },
  agentIntegrations: {
    userId: 'userId',
    provider: 'provider',
    enabled: 'enabled',
    status: 'status',
    config: 'config',
  },
}));

import {
  validateManualChannel,
  validateSettings,
  validateTimezone,
  validateTimeFormat,
  validateTimeRange,
  validateDaysOfWeek,
  validateCustomReminderDays,
  validateRetryAttempts,
  validateRetryDelayHours,
  validateLanguage,
  validateVoiceGender,
} from '../settings-manager';

describe('validateManualChannel', () => {
  it('should accept "sms" as valid channel', () => {
    expect(validateManualChannel('sms')).toBe(true);
  });

  it('should accept "voice" as valid channel', () => {
    expect(validateManualChannel('voice')).toBe(true);
  });

  it('should reject invalid channel values', () => {
    expect(validateManualChannel('email')).toBe(false);
    expect(validateManualChannel('phone')).toBe(false);
    expect(validateManualChannel('')).toBe(false);
    expect(validateManualChannel('SMS')).toBe(false); // case-sensitive
    expect(validateManualChannel('VOICE')).toBe(false); // case-sensitive
  });
});

describe('validateSettings - manualChannel validation', () => {
  it('should accept valid manualChannel in settings', () => {
    const result = validateSettings({ manualChannel: 'sms' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept voice as manualChannel', () => {
    const result = validateSettings({ manualChannel: 'voice' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid manualChannel values', () => {
    const result = validateSettings({ manualChannel: 'email' as any });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid manual channel. Must be either sms or voice.');
  });

  it('should validate multiple fields including manualChannel', () => {
    const result = validateSettings({
      manualChannel: 'sms',
      smartMode: true,
      callTimezone: 'UTC',
      language: 'en',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateTimezone', () => {
  it('should accept valid IANA timezones', () => {
    expect(validateTimezone('UTC')).toBe(true);
    expect(validateTimezone('America/New_York')).toBe(true);
    expect(validateTimezone('Asia/Kolkata')).toBe(true);
  });

  it('should reject invalid timezones', () => {
    expect(validateTimezone('Invalid/Timezone')).toBe(false);
    expect(validateTimezone('')).toBe(false);
  });
});

describe('validateTimeFormat', () => {
  it('should accept valid time formats', () => {
    expect(validateTimeFormat('09:00:00')).toBe(true);
    expect(validateTimeFormat('18:30:45')).toBe(true);
    expect(validateTimeFormat('00:00:00')).toBe(true);
    expect(validateTimeFormat('23:59:59')).toBe(true);
  });

  it('should reject invalid time formats', () => {
    expect(validateTimeFormat('9:00:00')).toBe(false); // missing leading zero
    expect(validateTimeFormat('09:00')).toBe(false); // missing seconds
    expect(validateTimeFormat('25:00:00')).toBe(false); // invalid hour
    expect(validateTimeFormat('09:60:00')).toBe(false); // invalid minute
  });
});

describe('validateTimeRange', () => {
  it('should accept valid time ranges', () => {
    expect(validateTimeRange('09:00:00', '18:00:00')).toBe(true);
    expect(validateTimeRange('00:00:00', '23:59:59')).toBe(true);
  });

  it('should reject invalid time ranges', () => {
    expect(validateTimeRange('18:00:00', '09:00:00')).toBe(false); // end before start
    expect(validateTimeRange('09:00:00', '09:00:00')).toBe(false); // same time
  });
});

describe('validateDaysOfWeek', () => {
  it('should accept valid days of week', () => {
    expect(validateDaysOfWeek([1, 2, 3, 4, 5])).toBe(true); // weekdays
    expect(validateDaysOfWeek([0, 6])).toBe(true); // weekend
    expect(validateDaysOfWeek([0, 1, 2, 3, 4, 5, 6])).toBe(true); // all days
  });

  it('should reject invalid days of week', () => {
    expect(validateDaysOfWeek([])).toBe(false); // empty array
    expect(validateDaysOfWeek([7])).toBe(false); // invalid day
    expect(validateDaysOfWeek([-1])).toBe(false); // negative day
  });
});

describe('validateCustomReminderDays', () => {
  it('should accept valid custom reminder days', () => {
    expect(validateCustomReminderDays([5, 10, 15])).toBe(true);
    expect(validateCustomReminderDays([-5, -10])).toBe(true); // overdue
    expect(validateCustomReminderDays([])).toBe(true); // empty is valid
  });

  it('should reject invalid custom reminder days', () => {
    expect(validateCustomReminderDays([0])).toBe(false); // zero not allowed
    expect(validateCustomReminderDays([31])).toBe(false); // out of range
    expect(validateCustomReminderDays([-31])).toBe(false); // out of range
  });
});

describe('validateRetryAttempts', () => {
  it('should accept valid retry attempts', () => {
    expect(validateRetryAttempts(0)).toBe(true);
    expect(validateRetryAttempts(3)).toBe(true);
    expect(validateRetryAttempts(10)).toBe(true);
  });

  it('should reject invalid retry attempts', () => {
    expect(validateRetryAttempts(-1)).toBe(false);
    expect(validateRetryAttempts(11)).toBe(false);
    expect(validateRetryAttempts(1.5)).toBe(false); // not integer
  });
});

describe('validateRetryDelayHours', () => {
  it('should accept valid retry delay hours', () => {
    expect(validateRetryDelayHours(1)).toBe(true);
    expect(validateRetryDelayHours(24)).toBe(true);
    expect(validateRetryDelayHours(48)).toBe(true);
  });

  it('should reject invalid retry delay hours', () => {
    expect(validateRetryDelayHours(0)).toBe(false);
    expect(validateRetryDelayHours(49)).toBe(false);
    expect(validateRetryDelayHours(1.5)).toBe(false); // not integer
  });
});

describe('validateLanguage', () => {
  it('should accept valid languages', () => {
    expect(validateLanguage('en')).toBe(true);
    expect(validateLanguage('hi')).toBe(true);
    expect(validateLanguage('hinglish')).toBe(true);
  });

  it('should reject invalid languages', () => {
    expect(validateLanguage('fr')).toBe(false);
    expect(validateLanguage('EN')).toBe(false); // case-sensitive
    expect(validateLanguage('')).toBe(false);
  });
});

describe('validateVoiceGender', () => {
  it('should accept valid voice genders', () => {
    expect(validateVoiceGender('male')).toBe(true);
    expect(validateVoiceGender('female')).toBe(true);
  });

  it('should reject invalid voice genders', () => {
    expect(validateVoiceGender('other')).toBe(false);
    expect(validateVoiceGender('MALE')).toBe(false); // case-sensitive
    expect(validateVoiceGender('')).toBe(false);
  });
});
