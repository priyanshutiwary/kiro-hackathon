/**
 * Call Window Checking
 * 
 * Manages call window validation and timezone-aware time checking.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */

import { ReminderSettings } from './settings-manager';

/**
 * CallWindowCheck result interface
 */
export interface CallWindowCheck {
  canCall: boolean;
  reason?: string;
  nextAvailableTime?: Date;
}

/**
 * Gets the current time in a specific timezone
 * 
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York', 'Europe/London')
 * @returns Date object representing current time in the specified timezone
 * 
 * Requirements: 2.1, 2.7, 2.8
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  // Get current UTC time
  const now = new Date();
  
  // Use Intl.DateTimeFormat to get the time in the target timezone
  // This handles all timezone conversions including DST automatically
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const dateParts: Record<string, string> = {};
  
  for (const part of parts) {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  }
  
  // Construct a date string in ISO format
  const year = dateParts.year;
  const month = dateParts.month;
  const day = dateParts.day;
  const hour = dateParts.hour;
  const minute = dateParts.minute;
  const second = dateParts.second;
  
  // Create a date object representing the local time in the target timezone
  // Note: This creates a Date object with the local time values, but the Date object
  // itself is still in the system's timezone. This is intentional for comparison purposes.
  const localDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  
  return localDate;
}

/**
 * Checks if a call can be made now based on user settings
 * 
 * Validates:
 * 1. Current time is within the configured call window (start time to end time)
 * 2. Current day is in the allowed days of week
 * 
 * @param settings - User reminder settings containing call window configuration
 * @returns CallWindowCheck result indicating if call can be made and reason if not
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function canMakeCallNow(settings: ReminderSettings): CallWindowCheck {
  // Get current time in user's timezone
  const currentTime = getCurrentTimeInTimezone(settings.callTimezone);
  
  // Get current day of week (0 = Sunday, 6 = Saturday)
  const currentDayOfWeek = currentTime.getDay();
  
  // Check if current day is allowed
  if (!settings.callDaysOfWeek.includes(currentDayOfWeek)) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      canCall: false,
      reason: `Calls are not allowed on ${dayNames[currentDayOfWeek]}`,
      nextAvailableTime: calculateNextAvailableTime(currentTime, settings),
    };
  }
  
  // Get current time in HH:MM:SS format
  const currentTimeStr = formatTimeToHHMMSS(currentTime);
  
  // Check if current time is within call window
  if (!isTimeInWindow(currentTimeStr, settings.callStartTime, settings.callEndTime)) {
    return {
      canCall: false,
      reason: `Current time ${currentTimeStr} is outside call window (${settings.callStartTime} - ${settings.callEndTime})`,
      nextAvailableTime: calculateNextAvailableTime(currentTime, settings),
    };
  }
  
  // All checks passed
  return {
    canCall: true,
  };
}

/**
 * Formats a Date object to HH:MM:SS string
 */
function formatTimeToHHMMSS(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Checks if a time is within a time window
 */
function isTimeInWindow(currentTime: string, startTime: string, endTime: string): boolean {
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Calculates the next available time when a call can be made
 * 
 * @param currentTime - Current time in user's timezone
 * @param settings - User reminder settings
 * @returns Next available time for making a call
 */
function calculateNextAvailableTime(currentTime: Date, settings: ReminderSettings): Date {
  const nextTime = new Date(currentTime);
  const currentDayOfWeek = nextTime.getDay();
  const currentTimeStr = formatTimeToHHMMSS(nextTime);
  
  // If we're on an allowed day but outside the time window
  if (settings.callDaysOfWeek.includes(currentDayOfWeek)) {
    // If before start time, return today at start time
    if (currentTimeStr < settings.callStartTime) {
      const [hours, minutes, seconds] = settings.callStartTime.split(':').map(Number);
      nextTime.setHours(hours, minutes, seconds, 0);
      return nextTime;
    }
    // If after end time, move to next allowed day at start time
  }
  
  // Find next allowed day
  let daysToAdd = 1;
  let nextDayOfWeek = (currentDayOfWeek + daysToAdd) % 7;
  
  // Keep searching until we find an allowed day (max 7 days)
  while (!settings.callDaysOfWeek.includes(nextDayOfWeek) && daysToAdd <= 7) {
    daysToAdd++;
    nextDayOfWeek = (currentDayOfWeek + daysToAdd) % 7;
  }
  
  // Set to next allowed day at start time
  nextTime.setDate(nextTime.getDate() + daysToAdd);
  const [hours, minutes, seconds] = settings.callStartTime.split(':').map(Number);
  nextTime.setHours(hours, minutes, seconds, 0);
  
  return nextTime;
}
