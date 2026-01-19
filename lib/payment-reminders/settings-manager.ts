/**
 * Reminder Settings Manager
 * 
 * Manages user reminder settings including validation, retrieval, and updates.
 * Requirements: 1.1-1.13, 2.1-2.8, 11.1-11.6, 13.1-13.6
 */

import { db } from "@/db/drizzle";
import { reminderSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * ReminderSettings interface representing user reminder configuration
 */
export interface ReminderSettings {
  userId: string;
  organizationId: string | null;
  
  // Reminder schedule
  reminder30DaysBefore: boolean;
  reminder15DaysBefore: boolean;
  reminder7DaysBefore: boolean;
  reminder5DaysBefore: boolean;
  reminder3DaysBefore: boolean;
  reminder1DayBefore: boolean;
  reminderOnDueDate: boolean;
  reminder1DayOverdue: boolean;
  reminder3DaysOverdue: boolean;
  reminder7DaysOverdue: boolean;
  customReminderDays: number[];
  
  // Call timing
  callTimezone: string;
  callStartTime: string;
  callEndTime: string;
  callDaysOfWeek: number[];
  
  // Voice and Language Settings
  language: string;
  voiceGender: string;
  
  // Retry settings
  maxRetryAttempts: number;
  retryDelayHours: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Default reminder settings for new users
 */
export const DEFAULT_REMINDER_SETTINGS: Omit<ReminderSettings, 'userId' | 'organizationId'> = {
  // Reminder schedule - sensible defaults
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
  
  // Call timing - 9 AM to 6 PM UTC, weekdays only
  callTimezone: 'UTC',
  callStartTime: '09:00:00',
  callEndTime: '18:00:00',
  callDaysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  
  // Voice and Language Settings
  language: 'en',
  voiceGender: 'female',
  
  // Retry settings
  maxRetryAttempts: 3,
  retryDelayHours: 2,
};

/**
 * List of valid IANA timezone identifiers
 * This is a subset of commonly used timezones. For production, consider using a library like 'moment-timezone'
 */
const VALID_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Stockholm',
  'Europe/Copenhagen',
  'Europe/Oslo',
  'Europe/Helsinki',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Athens',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
];

/**
 * Validates timezone string
 * Requirements: 2.7
 */
export function validateTimezone(timezone: string): boolean {
  return VALID_TIMEZONES.includes(timezone);
}

/**
 * Validates time string in HH:MM:SS format
 * Requirements: 2.2, 2.3
 */
export function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
  return timeRegex.test(time);
}

/**
 * Validates time range (start time must be before end time)
 * Requirements: 2.2, 2.3
 */
export function validateTimeRange(startTime: string, endTime: string): boolean {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return false;
  }
  
  // Convert to minutes for comparison
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  return startMinutes < endMinutes;
}

/**
 * Helper function to convert time string to minutes
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Validates days of week array
 * Requirements: 2.4
 */
export function validateDaysOfWeek(days: number[]): boolean {
  if (!Array.isArray(days) || days.length === 0) {
    return false;
  }
  
  // Days must be between 0 (Sunday) and 6 (Saturday)
  return days.every(day => Number.isInteger(day) && day >= 0 && day <= 6);
}

/**
 * Validates custom reminder days
 * Requirements: 1.12
 */
export function validateCustomReminderDays(days: number[]): boolean {
  if (!Array.isArray(days)) {
    return false;
  }
  
  // Custom days can be positive (before due) or negative (after due/overdue)
  // Reasonable range: -30 to +30 days
  return days.every(day => Number.isInteger(day) && day >= -30 && day <= 30 && day !== 0);
}

/**
 * Validates retry attempts
 * Requirements: 13.1, 13.4
 */
export function validateRetryAttempts(attempts: number): boolean {
  return Number.isInteger(attempts) && attempts >= 0 && attempts <= 10;
}

/**
 * Validates retry delay hours
 * Requirements: 13.3
 */
export function validateRetryDelayHours(hours: number): boolean {
  return Number.isInteger(hours) && hours >= 1 && hours <= 48;
}

/**
 * Validates language setting
 */
export function validateLanguage(language: string): boolean {
  const validLanguages = ['en', 'hi', 'hinglish'];
  return validLanguages.includes(language);
}

/**
 * Validates voice gender setting
 */
export function validateVoiceGender(voiceGender: string): boolean {
  const validVoiceGenders = ['male', 'female'];
  return validVoiceGenders.includes(voiceGender);
}

/**
 * Validates complete reminder settings
 * Requirements: 1.1-1.13, 2.1-2.8, 11.5, 13.1-13.6
 */
export function validateSettings(settings: Partial<ReminderSettings>): ValidationResult {
  const errors: string[] = [];
  
  // Validate timezone
  if (settings.callTimezone !== undefined && !validateTimezone(settings.callTimezone)) {
    errors.push(`Invalid timezone: ${settings.callTimezone}. Must be a valid IANA timezone identifier.`);
  }
  
  // Validate time format
  if (settings.callStartTime !== undefined && !validateTimeFormat(settings.callStartTime)) {
    errors.push(`Invalid start time format: ${settings.callStartTime}. Must be in HH:MM:SS format.`);
  }
  
  if (settings.callEndTime !== undefined && !validateTimeFormat(settings.callEndTime)) {
    errors.push(`Invalid end time format: ${settings.callEndTime}. Must be in HH:MM:SS format.`);
  }
  
  // Validate time range
  if (settings.callStartTime !== undefined && settings.callEndTime !== undefined) {
    if (!validateTimeRange(settings.callStartTime, settings.callEndTime)) {
      errors.push('Call start time must be before call end time.');
    }
  }
  
  // Validate days of week
  if (settings.callDaysOfWeek !== undefined && !validateDaysOfWeek(settings.callDaysOfWeek)) {
    errors.push('Invalid days of week. Must be an array of integers between 0 (Sunday) and 6 (Saturday).');
  }
  
  // Validate custom reminder days
  if (settings.customReminderDays !== undefined && !validateCustomReminderDays(settings.customReminderDays)) {
    errors.push('Invalid custom reminder days. Must be integers between -30 and +30 (excluding 0).');
  }
  
  // Validate retry attempts
  if (settings.maxRetryAttempts !== undefined && !validateRetryAttempts(settings.maxRetryAttempts)) {
    errors.push('Invalid max retry attempts. Must be an integer between 0 and 10.');
  }
  
  // Validate retry delay hours
  if (settings.retryDelayHours !== undefined && !validateRetryDelayHours(settings.retryDelayHours)) {
    errors.push('Invalid retry delay hours. Must be an integer between 1 and 48.');
  }
  
  // Validate language
  if (settings.language !== undefined && !validateLanguage(settings.language)) {
    errors.push('Invalid language. Must be one of: en, hi, hinglish.');
  }
  
  // Validate voice gender
  if (settings.voiceGender !== undefined && !validateVoiceGender(settings.voiceGender)) {
    errors.push('Invalid voice gender. Must be either male or female.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets supported IANA timezones
 * Requirements: 2.7
 */
export function getSupportedTimezones(): string[] {
  return [...VALID_TIMEZONES];
}

/**
 * Helper function to get organization ID from agent integrations
 */
async function getOrganizationIdFromIntegration(userId: string): Promise<string | null> {
  try {
    const { agentIntegrations } = await import("@/db/schema");
    const { and } = await import("drizzle-orm");
    
    const integrations = await db
      .select({
        config: agentIntegrations.config,
      })
      .from(agentIntegrations)
      .where(
        and(
          eq(agentIntegrations.userId, userId),
          eq(agentIntegrations.provider, 'zoho_books'),
          eq(agentIntegrations.enabled, true),
          eq(agentIntegrations.status, 'active')
        )
      )
      .limit(1);

    if (integrations.length === 0 || !integrations[0].config) {
      return null;
    }

    const config = JSON.parse(integrations[0].config);
    return config.organizationId || config.organization_id || null;
  } catch (error) {
    console.error('Error fetching organization ID from integration:', error);
    return null;
  }
}

/**
 * Gets user reminder settings from database
 * If settings don't exist, returns default settings
 * Requirements: 11.1, 11.2
 */
export async function getUserSettings(userId: string): Promise<ReminderSettings> {
  const settings = await db
    .select()
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, userId))
    .limit(1);
  
  if (settings.length === 0) {
    // Try to get organizationId from agentIntegrations
    const orgId = await getOrganizationIdFromIntegration(userId);
    
    // Return default settings for new users
    return {
      userId,
      organizationId: orgId,
      ...DEFAULT_REMINDER_SETTINGS,
    };
  }
  
  const dbSettings = settings[0];
  
  // Parse JSON fields
  const customReminderDays = JSON.parse(dbSettings.customReminderDays);
  const callDaysOfWeek = JSON.parse(dbSettings.callDaysOfWeek);
  
  return {
    userId: dbSettings.userId,
    organizationId: dbSettings.organizationId,
    reminder30DaysBefore: dbSettings.reminder30DaysBefore,
    reminder15DaysBefore: dbSettings.reminder15DaysBefore,
    reminder7DaysBefore: dbSettings.reminder7DaysBefore,
    reminder5DaysBefore: dbSettings.reminder5DaysBefore,
    reminder3DaysBefore: dbSettings.reminder3DaysBefore,
    reminder1DayBefore: dbSettings.reminder1DayBefore,
    reminderOnDueDate: dbSettings.reminderOnDueDate,
    reminder1DayOverdue: dbSettings.reminder1DayOverdue,
    reminder3DaysOverdue: dbSettings.reminder3DaysOverdue,
    reminder7DaysOverdue: dbSettings.reminder7DaysOverdue,
    customReminderDays,
    callTimezone: dbSettings.callTimezone,
    callStartTime: dbSettings.callStartTime,
    callEndTime: dbSettings.callEndTime,
    callDaysOfWeek,
    language: dbSettings.language,
    voiceGender: dbSettings.voiceGender,
    maxRetryAttempts: dbSettings.maxRetryAttempts,
    retryDelayHours: dbSettings.retryDelayHours,
  };
}

/**
 * Updates user reminder settings in database
 * Validates settings before updating
 * Creates new settings record if one doesn't exist
 * Requirements: 11.3, 11.5, 11.6
 */
export async function updateUserSettings(
  userId: string,
  updates: Partial<ReminderSettings>
): Promise<{ success: boolean; errors?: string[] }> {
  // Validate the updates
  const validation = validateSettings(updates);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }
  
  // Check if settings exist
  const existing = await db
    .select()
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, userId))
    .limit(1);
  
  // Prepare the data for database
  const dbData: Partial<typeof reminderSettings.$inferInsert> = {
    userId,
    updatedAt: new Date(),
  };
  
  // Map updates to database columns
  if (updates.organizationId !== undefined) {
    dbData.organizationId = updates.organizationId;
  }
  if (updates.reminder30DaysBefore !== undefined) {
    dbData.reminder30DaysBefore = updates.reminder30DaysBefore;
  }
  if (updates.reminder15DaysBefore !== undefined) {
    dbData.reminder15DaysBefore = updates.reminder15DaysBefore;
  }
  if (updates.reminder7DaysBefore !== undefined) {
    dbData.reminder7DaysBefore = updates.reminder7DaysBefore;
  }
  if (updates.reminder5DaysBefore !== undefined) {
    dbData.reminder5DaysBefore = updates.reminder5DaysBefore;
  }
  if (updates.reminder3DaysBefore !== undefined) {
    dbData.reminder3DaysBefore = updates.reminder3DaysBefore;
  }
  if (updates.reminder1DayBefore !== undefined) {
    dbData.reminder1DayBefore = updates.reminder1DayBefore;
  }
  if (updates.reminderOnDueDate !== undefined) {
    dbData.reminderOnDueDate = updates.reminderOnDueDate;
  }
  if (updates.reminder1DayOverdue !== undefined) {
    dbData.reminder1DayOverdue = updates.reminder1DayOverdue;
  }
  if (updates.reminder3DaysOverdue !== undefined) {
    dbData.reminder3DaysOverdue = updates.reminder3DaysOverdue;
  }
  if (updates.reminder7DaysOverdue !== undefined) {
    dbData.reminder7DaysOverdue = updates.reminder7DaysOverdue;
  }
  if (updates.customReminderDays !== undefined) {
    dbData.customReminderDays = JSON.stringify(updates.customReminderDays);
  }
  if (updates.callTimezone !== undefined) {
    dbData.callTimezone = updates.callTimezone;
  }
  if (updates.callStartTime !== undefined) {
    dbData.callStartTime = updates.callStartTime;
  }
  if (updates.callEndTime !== undefined) {
    dbData.callEndTime = updates.callEndTime;
  }
  if (updates.callDaysOfWeek !== undefined) {
    dbData.callDaysOfWeek = JSON.stringify(updates.callDaysOfWeek);
  }
  if (updates.maxRetryAttempts !== undefined) {
    dbData.maxRetryAttempts = updates.maxRetryAttempts;
  }
  if (updates.retryDelayHours !== undefined) {
    dbData.retryDelayHours = updates.retryDelayHours;
  }
  if (updates.language !== undefined) {
    dbData.language = updates.language;
  }
  if (updates.voiceGender !== undefined) {
    dbData.voiceGender = updates.voiceGender;
  }
  
  try {
    if (existing.length === 0) {
      // If organizationId is not provided, try to get it from agentIntegrations
      if (!dbData.organizationId) {
        const orgId = await getOrganizationIdFromIntegration(userId);
        if (orgId) {
          dbData.organizationId = orgId;
        }
      }
      
      // Create new settings with defaults merged with updates
      const newSettings = {
        id: crypto.randomUUID(),
        ...DEFAULT_REMINDER_SETTINGS,
        userId,
        organizationId: null,
        customReminderDays: JSON.stringify(DEFAULT_REMINDER_SETTINGS.customReminderDays),
        callDaysOfWeek: JSON.stringify(DEFAULT_REMINDER_SETTINGS.callDaysOfWeek),
        createdAt: new Date(),
        ...dbData,
      };
      
      await db.insert(reminderSettings).values(newSettings);
    } else {
      // Update existing settings
      await db
        .update(reminderSettings)
        .set(dbData)
        .where(eq(reminderSettings.userId, userId));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    return {
      success: false,
      errors: ['Failed to update settings. Please try again.'],
    };
  }
}
