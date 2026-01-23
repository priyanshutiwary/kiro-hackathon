/**
 * Channel Assignment Module
 * 
 * Determines whether a reminder should be sent via SMS or voice call
 * based on user settings and reminder urgency.
 * 
 * Requirements: 2.1-2.5, 3.1-3.5
 */

/**
 * Channel type for reminder delivery
 */
export type Channel = 'sms' | 'voice';

/**
 * Reminder settings for channel assignment
 */
export interface ChannelAssignmentSettings {
  smartMode: boolean;
  manualChannel: Channel;
}

/**
 * Early reminder types (7+ days before due date)
 * These are mapped to SMS in smart mode for cost optimization
 */
const EARLY_REMINDER_TYPES = [
  '30_days_before',
  '15_days_before',
  '7_days_before',
  '5_days_before',
] as const;

/**
 * Urgent reminder types (3 days or less before due, or overdue)
 * These are mapped to voice in smart mode for higher engagement
 */
const URGENT_REMINDER_TYPES = [
  '3_days_before',
  '1_day_before',
  'on_due_date',
  '1_day_overdue',
  '3_days_overdue',
  '7_days_overdue',
] as const;

/**
 * Assigns a communication channel (SMS or voice) to a reminder
 * based on user settings and reminder type.
 * 
 * Smart Mode (Requirement 2.1, 2.2):
 * - Early reminders (30, 15, 7, 5 days before) → SMS
 * - Urgent reminders (3, 1 day before, due date, overdue) → Voice
 * 
 * Manual Mode (Requirement 3.1, 3.2):
 * - All reminders use the user-selected channel
 * 
 * Default Fallback (Requirement 2.2):
 * - Unknown reminder types default to voice for safety
 * 
 * @param reminderType - The type of reminder (e.g., '7_days_before', '1_day_overdue')
 * @param settings - User's channel assignment settings
 * @returns The assigned channel ('sms' or 'voice')
 */
export function assignChannel(
  reminderType: string,
  settings: ChannelAssignmentSettings
): Channel {
  // Manual mode: use user-selected channel (Requirements 3.1, 3.2)
  if (!settings.smartMode) {
    return settings.manualChannel;
  }
  
  // Smart mode: assign based on urgency (Requirements 2.1, 2.2)
  
  // Check if it's an early reminder → SMS
  if (EARLY_REMINDER_TYPES.includes(reminderType as typeof EARLY_REMINDER_TYPES[number])) {
    return 'sms';
  }
  
  // Check if it's an urgent reminder → Voice
  if (URGENT_REMINDER_TYPES.includes(reminderType as typeof URGENT_REMINDER_TYPES[number])) {
    return 'voice';
  }
  
  // Handle custom reminder types
  // Custom reminders follow the pattern: custom_X_days_before or custom_X_days_overdue
  if (reminderType.startsWith('custom_')) {
    const match = reminderType.match(/custom_(\d+)_days_(before|overdue)/);
    
    if (match) {
      const days = parseInt(match[1], 10);
      const timing = match[2];
      
      // Custom reminders 5+ days before → SMS
      if (timing === 'before' && days >= 5) {
        return 'sms';
      }
      
      // Custom reminders before due date (but less than 5 days) → Voice
      if (timing === 'before' && days < 5) {
        return 'voice';
      }
      
      // Any overdue reminder → Voice
      if (timing === 'overdue') {
        return 'voice';
      }
    }
    
    // Custom on due date → Voice
    if (reminderType === 'custom_on_due_date') {
      return 'voice';
    }
  }
  
  // Default fallback to voice for unknown types (Requirement 2.2)
  console.warn(`[Channel Assignment] Unknown reminder type: ${reminderType}, defaulting to voice`);
  return 'voice';
}
