# Call Window Checking Implementation

## Overview

This module implements call window checking functionality for the Payment Reminder Call system. It ensures that reminder calls are only made during appropriate business hours in the user's configured timezone.

## Files

- `call-window.ts` - Core implementation of call window checking functions
- `call-window-example.ts` - Example usage demonstrating the functionality

## Functions

### `getCurrentTimeInTimezone(timezone: string): Date`

Converts the current time to a specific timezone using IANA timezone identifiers.

**Parameters:**
- `timezone` - IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo')

**Returns:**
- Date object representing the current time in the specified timezone

**Requirements:** 2.1, 2.7, 2.8

**Example:**
```typescript
const currentTimeNY = getCurrentTimeInTimezone('America/New_York');
console.log(currentTimeNY.toLocaleString()); // "1/9/2026, 2:34:23 PM"
```

### `canMakeCallNow(settings: ReminderSettings): CallWindowCheck`

Checks if a call can be made now based on user settings.

**Parameters:**
- `settings` - User reminder settings containing call window configuration

**Returns:**
- `CallWindowCheck` object with:
  - `canCall` - Boolean indicating if call can be made
  - `reason` - Optional string explaining why call cannot be made
  - `nextAvailableTime` - Optional Date indicating when next call can be made

**Requirements:** 2.2, 2.3, 2.4, 2.5, 2.6

**Validation:**
1. Checks if current time is within configured call window (start time to end time)
2. Checks if current day is in the allowed days of week

**Example:**
```typescript
const settings: ReminderSettings = {
  // ... other settings
  callTimezone: 'America/New_York',
  callStartTime: '09:00:00',
  callEndTime: '18:00:00',
  callDaysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
};

const result = canMakeCallNow(settings);
if (result.canCall) {
  console.log('Call can be made now');
} else {
  console.log('Cannot make call:', result.reason);
  console.log('Next available:', result.nextAvailableTime);
}
```

## Interfaces

### `CallWindowCheck`

```typescript
interface CallWindowCheck {
  canCall: boolean;
  reason?: string;
  nextAvailableTime?: Date;
}
```

## Implementation Details

### Timezone Handling

The implementation uses the `Intl.DateTimeFormat` API to handle timezone conversions. This approach:
- Automatically handles Daylight Saving Time (DST) transitions
- Supports all IANA timezone identifiers
- Works across different operating systems and environments
- Provides accurate timezone conversions without external dependencies

### Call Window Logic

The `canMakeCallNow` function performs the following checks:

1. **Day of Week Check**: Verifies the current day (in user's timezone) is in the allowed days list
2. **Time Window Check**: Verifies the current time (in user's timezone) falls between start and end times
3. **Next Available Time Calculation**: If call cannot be made, calculates the next available time slot

### Time Comparison

Time comparisons are done using string comparison of HH:MM:SS format, which works correctly because:
- All times are zero-padded (e.g., "09:00:00" not "9:0:0")
- Lexicographic comparison of properly formatted time strings gives correct chronological ordering
- Example: "09:30:00" < "18:00:00" evaluates to true

## Testing

Run the example file to see the functions in action:

```bash
npx tsx lib/payment-reminders/call-window-example.ts
```

The example demonstrates:
1. Getting current time in different timezones
2. Checking call windows with business hours settings
3. Checking call windows with 24/7 settings
4. Checking call windows with weekend-only settings
5. Timezone awareness across multiple regions

## Integration

This module integrates with:
- `settings-manager.ts` - Uses `ReminderSettings` interface
- Future: `reminder-scheduler.ts` - Will use `canMakeCallNow` to validate call timing
- Future: `call-executor.ts` - Will use call window checks before initiating calls

## Requirements Satisfied

- ✅ 2.1 - Allow users to select a timezone for call scheduling
- ✅ 2.2 - Allow users to specify a call start time
- ✅ 2.3 - Allow users to specify a call end time
- ✅ 2.4 - Allow users to select which days of the week calls can be made
- ✅ 2.5 - Only initiate calls within the configured call window
- ✅ 2.6 - Wait until the next valid call time when outside window
- ✅ 2.7 - Support all standard IANA timezone identifiers
- ✅ 2.8 - Calculate call windows based on user's selected timezone
