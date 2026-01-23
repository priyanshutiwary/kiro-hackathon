# Channel Assignment Integration

## Overview

This document describes the integration of channel assignment (SMS vs Voice) into the reminder creation flow. The implementation ensures that reminders are assigned the correct communication channel at creation time based on user settings.

## Changes Made

### 1. Settings Manager Updates (`settings-manager.ts`)

**Added to ReminderSettings interface:**
- `smartMode: boolean` - Enables automatic channel selection based on urgency
- `manualChannel: 'sms' | 'voice'` - User-selected channel when smart mode is disabled

**Updated DEFAULT_REMINDER_SETTINGS:**
- Added `smartMode: true` (smart mode enabled by default)
- Added `manualChannel: 'voice'` (default to voice when in manual mode)

**Updated getUserSettings function:**
- Returns `smartMode` and `manualChannel` fields from database
- Falls back to defaults if fields are missing

**Updated updateUserSettings function:**
- Handles updates to `smartMode` and `manualChannel` fields

### 2. Sync Engine Updates (`sync-engine.ts`)

**Added import:**
```typescript
import { assignChannel } from "./channel-assignment";
```

**Updated createRemindersForInvoice function:**
- Calls `assignChannel()` for each reminder during creation
- Stores the assigned channel in the reminder record
- Channel is determined based on:
  - Reminder type (e.g., '7_days_before', '1_day_overdue')
  - User's `smartMode` setting
  - User's `manualChannel` preference

**Updated batch reminder creation:**
- Same channel assignment logic applied to batch operations
- Ensures consistency across all reminder creation paths

## How It Works

### Smart Mode (Default)

When `smartMode: true`:
- **Early reminders** (30, 15, 7, 5 days before) → SMS
- **Urgent reminders** (3, 1 day before, due date, overdue) → Voice
- **Unknown types** → Voice (safe default)

### Manual Mode

When `smartMode: false`:
- All reminders use the `manualChannel` setting
- User can select either 'sms' or 'voice'

### Channel Assignment Flow

```
Invoice Sync
    ↓
createRemindersForInvoice()
    ↓
buildReminderSchedule() → Returns list of reminder types
    ↓
For each reminder:
    ↓
assignChannel(reminderType, settings) → Returns 'sms' or 'voice'
    ↓
Create reminder record with channel field
    ↓
Insert into database
```

## Key Design Decisions

### 1. Channel Set at Creation Time

The channel is assigned when the reminder is created and stored in the database. This means:
- ✅ Settings changes only affect **future** reminders
- ✅ Existing reminders keep their original channel
- ✅ No need to recalculate channel at execution time
- ✅ Clear audit trail of what channel was intended

### 2. Consistent Across All Creation Paths

Channel assignment is integrated into:
- Individual reminder creation (`createRemindersForInvoice`)
- Batch reminder creation (during full sync)
- Reminder recreation (after due date changes)

### 3. Settings Changes Don't Affect Existing Reminders

When a user changes their settings:
- Existing pending reminders keep their assigned channel
- Only new reminders created after the change use the new settings
- This prevents confusion and maintains consistency

## Testing

### Unit Tests
- ✅ Channel assignment logic (smart mode)
- ✅ Channel assignment logic (manual mode)
- ✅ Integration with reminder creation flow

### Test Coverage
- Smart mode: Early reminders → SMS
- Smart mode: Urgent reminders → Voice
- Manual mode: All reminders → Selected channel
- Settings changes: Only affect future reminders
- Batch creation: Correct channels assigned

## Database Schema

The `payment_reminders` table includes:
```sql
channel text NOT NULL DEFAULT 'voice'
```

This field stores the assigned channel for each reminder.

## Next Steps

The following tasks will build on this implementation:

1. **Task 6**: SMS reminder executor (reads channel field, sends SMS)
2. **Task 7**: Update unified executor (routes based on channel field)
3. **Task 10**: Update reminder settings API (expose smartMode/manualChannel)
4. **Task 12-14**: UI updates (display and configure channel settings)

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 2.3**: Channel is stored in database at creation time
- **Requirement 2.4**: Smart mode assigns channels based on urgency
- **Requirement 2.5**: Channel assignment happens during reminder creation
- **Requirement 3.3**: Settings changes apply to future reminders only
- **Requirement 3.4**: Manual mode uses user-selected channel
- **Requirement 3.5**: Existing reminders are not modified when settings change
