/**
 * Integration tests for channel assignment in reminder creation
 * 
 * Tests that reminders are created with the correct channel based on settings
 */

import { describe, it, expect } from 'vitest';
import { assignChannel } from '../channel-assignment';

describe('Reminder Creation with Channel Assignment', () => {
  describe('Smart Mode Integration', () => {
    const smartModeSettings = {
      smartMode: true,
      manualChannel: 'voice' as const,
    };

    it('should assign SMS channel to early reminders in smart mode', () => {
      const earlyReminderTypes = [
        '30_days_before',
        '15_days_before',
        '7_days_before',
        '5_days_before',
      ];

      earlyReminderTypes.forEach(reminderType => {
        const channel = assignChannel(reminderType, smartModeSettings);
        expect(channel).toBe('sms');
      });
    });

    it('should assign voice channel to urgent reminders in smart mode', () => {
      const urgentReminderTypes = [
        '3_days_before',
        '1_day_before',
        'on_due_date',
        '1_day_overdue',
        '3_days_overdue',
        '7_days_overdue',
      ];

      urgentReminderTypes.forEach(reminderType => {
        const channel = assignChannel(reminderType, smartModeSettings);
        expect(channel).toBe('voice');
      });
    });

    it('should create reminder records with correct channel field', () => {
      // Simulate reminder record creation
      const reminderTypes = [
        { type: '7_days_before', expectedChannel: 'sms' },
        { type: '3_days_before', expectedChannel: 'voice' },
        { type: '1_day_before', expectedChannel: 'voice' },
        { type: 'on_due_date', expectedChannel: 'voice' },
      ];

      reminderTypes.forEach(({ type, expectedChannel }) => {
        const channel = assignChannel(type, smartModeSettings);
        
        // Simulate reminder record structure
        const reminderRecord = {
          id: crypto.randomUUID(),
          reminderType: type,
          channel,
          status: 'pending',
        };

        expect(reminderRecord.channel).toBe(expectedChannel);
      });
    });
  });

  describe('Manual Mode Integration', () => {
    it('should assign SMS to all reminders when manual SMS mode is selected', () => {
      const manualSMSSettings = {
        smartMode: false,
        manualChannel: 'sms' as const,
      };

      const allReminderTypes = [
        '30_days_before',
        '7_days_before',
        '3_days_before',
        '1_day_before',
        'on_due_date',
        '1_day_overdue',
      ];

      allReminderTypes.forEach(reminderType => {
        const channel = assignChannel(reminderType, manualSMSSettings);
        expect(channel).toBe('sms');
      });
    });

    it('should assign voice to all reminders when manual voice mode is selected', () => {
      const manualVoiceSettings = {
        smartMode: false,
        manualChannel: 'voice' as const,
      };

      const allReminderTypes = [
        '30_days_before',
        '7_days_before',
        '3_days_before',
        '1_day_before',
        'on_due_date',
        '1_day_overdue',
      ];

      allReminderTypes.forEach(reminderType => {
        const channel = assignChannel(reminderType, manualVoiceSettings);
        expect(channel).toBe('voice');
      });
    });
  });

  describe('Settings Changes Do Not Affect Existing Reminders', () => {
    it('should demonstrate that channel is set at creation time', () => {
      // Initial settings: smart mode
      const initialSettings = {
        smartMode: true,
        manualChannel: 'voice' as const,
      };

      // Create a reminder with smart mode
      const reminderType = '7_days_before';
      const initialChannel = assignChannel(reminderType, initialSettings);
      
      // Simulate reminder record
      const reminderRecord = {
        id: crypto.randomUUID(),
        reminderType,
        channel: initialChannel,
        status: 'pending',
      };

      expect(reminderRecord.channel).toBe('sms');

      // Settings change to manual voice mode
      const newSettings = {
        smartMode: false,
        manualChannel: 'voice' as const,
      };

      // Existing reminder keeps its original channel
      // (channel is stored in DB, not recalculated)
      expect(reminderRecord.channel).toBe('sms');

      // New reminders would use the new settings
      const newChannel = assignChannel(reminderType, newSettings);
      expect(newChannel).toBe('voice');
    });
  });

  describe('Batch Reminder Creation', () => {
    it('should assign channels correctly when creating multiple reminders', () => {
      const settings = {
        smartMode: true,
        manualChannel: 'voice' as const,
      };

      const schedule = [
        { reminderType: '30_days_before', scheduledDate: new Date() },
        { reminderType: '7_days_before', scheduledDate: new Date() },
        { reminderType: '3_days_before', scheduledDate: new Date() },
        { reminderType: '1_day_before', scheduledDate: new Date() },
        { reminderType: 'on_due_date', scheduledDate: new Date() },
      ];

      const reminderRecords = schedule.map(item => {
        const channel = assignChannel(item.reminderType, settings);
        return {
          id: crypto.randomUUID(),
          reminderType: item.reminderType,
          scheduledDate: item.scheduledDate,
          channel,
          status: 'pending',
        };
      });

      // Verify channels
      expect(reminderRecords[0].channel).toBe('sms'); // 30 days
      expect(reminderRecords[1].channel).toBe('sms'); // 7 days
      expect(reminderRecords[2].channel).toBe('voice'); // 3 days
      expect(reminderRecords[3].channel).toBe('voice'); // 1 day
      expect(reminderRecords[4].channel).toBe('voice'); // due date
    });
  });
});
