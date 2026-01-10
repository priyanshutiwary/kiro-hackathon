/**
 * Reminder Schedule Builder
 * 
 * Builds reminder schedules based on user settings and invoice due dates.
 * Requirements: 1.1-1.12, 3.3-3.5, 6.1-6.2
 */

import { ReminderSettings } from './settings-manager';

/**
 * Reminder type representing when the reminder should be sent
 */
export interface ReminderScheduleItem {
  reminderType: string;
  scheduledDate: Date;
  daysOffset: number; // Positive = before due, Negative = after due (overdue)
}

/**
 * Standard reminder offsets in days
 * Positive values = days before due date
 * Negative values = days after due date (overdue)
 */
const STANDARD_REMINDERS = {
  reminder30DaysBefore: { offset: 30, type: '30_days_before' },
  reminder15DaysBefore: { offset: 15, type: '15_days_before' },
  reminder7DaysBefore: { offset: 7, type: '7_days_before' },
  reminder5DaysBefore: { offset: 5, type: '5_days_before' },
  reminder3DaysBefore: { offset: 3, type: '3_days_before' },
  reminder1DayBefore: { offset: 1, type: '1_day_before' },
  reminderOnDueDate: { offset: 0, type: 'on_due_date' },
  reminder1DayOverdue: { offset: -1, type: '1_day_overdue' },
  reminder3DaysOverdue: { offset: -3, type: '3_days_overdue' },
  reminder7DaysOverdue: { offset: -7, type: '7_days_overdue' },
};

/**
 * Builds a complete reminder schedule for an invoice based on user settings
 * 
 * Requirements:
 * - 1.1-1.12: Include standard reminders based on user settings
 * - 1.12: Include custom reminder days from settings
 * - 6.1: Generate reminder schedule based on user settings
 * - 6.2: Only create reminders for dates that are in the future or today
 * 
 * @param dueDate - The invoice due date
 * @param settings - User reminder settings
 * @param currentDate - Current date (defaults to now, can be overridden for testing)
 * @returns Array of reminder schedule items sorted chronologically
 */
export function buildReminderSchedule(
  dueDate: Date,
  settings: ReminderSettings,
  currentDate: Date = new Date()
): ReminderScheduleItem[] {
  const reminders: ReminderScheduleItem[] = [];
  
  // Normalize dates to start of day in UTC for comparison
  const normalizedCurrent = new Date(Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  ));
  
  const normalizedDue = new Date(Date.UTC(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  ));
  
  // Add standard reminders based on user settings
  for (const [settingKey, reminderConfig] of Object.entries(STANDARD_REMINDERS)) {
    const isEnabled = settings[settingKey as keyof ReminderSettings];
    
    if (isEnabled) {
      const scheduledDate = new Date(normalizedDue);
      scheduledDate.setUTCDate(scheduledDate.getUTCDate() - reminderConfig.offset);
      
      // Only include reminders that are today or in the future (Requirement 6.2)
      if (scheduledDate >= normalizedCurrent) {
        reminders.push({
          reminderType: reminderConfig.type,
          scheduledDate,
          daysOffset: reminderConfig.offset,
        });
      }
    }
  }
  
  // Add custom reminder days (Requirement 1.12)
  for (const customOffset of settings.customReminderDays) {
    const scheduledDate = new Date(normalizedDue);
    scheduledDate.setUTCDate(scheduledDate.getUTCDate() - customOffset);
    
    // Only include reminders that are today or in the future (Requirement 6.2)
    if (scheduledDate >= normalizedCurrent) {
      const reminderType = customOffset > 0 
        ? `custom_${customOffset}_days_before`
        : customOffset < 0
        ? `custom_${Math.abs(customOffset)}_days_overdue`
        : 'custom_on_due_date';
      
      reminders.push({
        reminderType,
        scheduledDate,
        daysOffset: customOffset,
      });
    }
  }
  
  // Sort reminders chronologically (earliest first)
  reminders.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  
  return reminders;
}

/**
 * Calculates the maximum reminder days from user settings
 * Used for determining the sync window
 * 
 * Requirements:
 * - 3.3: Calculate sync window based on maximum enabled reminder days
 * - 3.4: When user enables 30-day reminders, fetch invoices due within 35 days
 * - 3.5: When user enables 7-day reminders, fetch invoices due within 12 days
 * 
 * @param settings - User reminder settings
 * @returns Maximum number of days before due date that reminders are configured
 */
export function getMaxReminderDays(settings: ReminderSettings): number {
  let maxDays = 0;
  
  // Check standard reminders (only positive offsets count for sync window)
  if (settings.reminder30DaysBefore) maxDays = Math.max(maxDays, 30);
  if (settings.reminder15DaysBefore) maxDays = Math.max(maxDays, 15);
  if (settings.reminder7DaysBefore) maxDays = Math.max(maxDays, 7);
  if (settings.reminder5DaysBefore) maxDays = Math.max(maxDays, 5);
  if (settings.reminder3DaysBefore) maxDays = Math.max(maxDays, 3);
  if (settings.reminder1DayBefore) maxDays = Math.max(maxDays, 1);
  
  // Check custom reminder days (only positive offsets count for sync window)
  for (const customOffset of settings.customReminderDays) {
    if (customOffset > 0) {
      maxDays = Math.max(maxDays, customOffset);
    }
  }
  
  // If no reminders are enabled before due date, default to 0
  // This means we'll still sync invoices that are due soon or overdue
  return maxDays;
}
