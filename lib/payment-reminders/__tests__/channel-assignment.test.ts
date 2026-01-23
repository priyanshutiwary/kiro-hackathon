/**
 * Unit tests for Channel Assignment Module
 * 
 * Tests Requirements: 2.1-2.5, 3.1-3.5
 */

import { describe, it, expect } from 'vitest';
import { assignChannel, type ChannelAssignmentSettings } from '../channel-assignment';

describe('Channel Assignment', () => {
  describe('Smart Mode - Early Reminders (SMS)', () => {
    const smartModeSettings: ChannelAssignmentSettings = {
      smartMode: true,
      manualChannel: 'voice', // Should be ignored in smart mode
    };

    it('should assign SMS to 30 days before reminder', () => {
      const channel = assignChannel('30_days_before', smartModeSettings);
      expect(channel).toBe('sms');
    });

    it('should assign SMS to 15 days before reminder', () => {
      const channel = assignChannel('15_days_before', smartModeSettings);
      expect(channel).toBe('sms');
    });

    it('should assign SMS to 7 days before reminder', () => {
      const channel = assignChannel('7_days_before', smartModeSettings);
      expect(channel).toBe('sms');
    });

    it('should assign SMS to 5 days before reminder', () => {
      const channel = assignChannel('5_days_before', smartModeSettings);
      expect(channel).toBe('sms');
    });
  });

  describe('Smart Mode - Urgent Reminders (Voice)', () => {
    const smartModeSettings: ChannelAssignmentSettings = {
      smartMode: true,
      manualChannel: 'sms', // Should be ignored in smart mode
    };

    it('should assign voice to 3 days before reminder', () => {
      const channel = assignChannel('3_days_before', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to 1 day before reminder', () => {
      const channel = assignChannel('1_day_before', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to on due date reminder', () => {
      const channel = assignChannel('on_due_date', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to 1 day overdue reminder', () => {
      const channel = assignChannel('1_day_overdue', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to 3 days overdue reminder', () => {
      const channel = assignChannel('3_days_overdue', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to 7 days overdue reminder', () => {
      const channel = assignChannel('7_days_overdue', smartModeSettings);
      expect(channel).toBe('voice');
    });
  });

  describe('Smart Mode - Custom Reminders', () => {
    const smartModeSettings: ChannelAssignmentSettings = {
      smartMode: true,
      manualChannel: 'voice',
    };

    it('should assign SMS to custom 10 days before reminder', () => {
      const channel = assignChannel('custom_10_days_before', smartModeSettings);
      expect(channel).toBe('sms');
    });

    it('should assign SMS to custom 5 days before reminder', () => {
      const channel = assignChannel('custom_5_days_before', smartModeSettings);
      expect(channel).toBe('sms');
    });

    it('should assign voice to custom 3 days before reminder', () => {
      const channel = assignChannel('custom_3_days_before', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to custom 2 days before reminder', () => {
      const channel = assignChannel('custom_2_days_before', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to custom 1 day before reminder', () => {
      const channel = assignChannel('custom_1_days_before', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to custom on due date reminder', () => {
      const channel = assignChannel('custom_on_due_date', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to custom 1 day overdue reminder', () => {
      const channel = assignChannel('custom_1_days_overdue', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to custom 5 days overdue reminder', () => {
      const channel = assignChannel('custom_5_days_overdue', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should assign voice to custom 10 days overdue reminder', () => {
      const channel = assignChannel('custom_10_days_overdue', smartModeSettings);
      expect(channel).toBe('voice');
    });
  });

  describe('Smart Mode - Unknown Reminder Types', () => {
    const smartModeSettings: ChannelAssignmentSettings = {
      smartMode: true,
      manualChannel: 'sms',
    };

    it('should default to voice for unknown reminder type', () => {
      const channel = assignChannel('unknown_reminder_type', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should default to voice for malformed custom reminder', () => {
      const channel = assignChannel('custom_invalid', smartModeSettings);
      expect(channel).toBe('voice');
    });

    it('should default to voice for empty string', () => {
      const channel = assignChannel('', smartModeSettings);
      expect(channel).toBe('voice');
    });
  });

  describe('Manual Mode - SMS Selected', () => {
    const manualSMSSettings: ChannelAssignmentSettings = {
      smartMode: false,
      manualChannel: 'sms',
    };

    it('should assign SMS to all standard reminders when SMS is selected', () => {
      const reminderTypes = [
        '30_days_before',
        '15_days_before',
        '7_days_before',
        '5_days_before',
        '3_days_before',
        '1_day_before',
        'on_due_date',
        '1_day_overdue',
        '3_days_overdue',
        '7_days_overdue',
      ];

      reminderTypes.forEach((type) => {
        const channel = assignChannel(type, manualSMSSettings);
        expect(channel).toBe('sms');
      });
    });

    it('should assign SMS to custom reminders when SMS is selected', () => {
      const customTypes = [
        'custom_10_days_before',
        'custom_3_days_before',
        'custom_on_due_date',
        'custom_5_days_overdue',
      ];

      customTypes.forEach((type) => {
        const channel = assignChannel(type, manualSMSSettings);
        expect(channel).toBe('sms');
      });
    });

    it('should assign SMS to unknown reminder types when SMS is selected', () => {
      const channel = assignChannel('unknown_type', manualSMSSettings);
      expect(channel).toBe('sms');
    });
  });

  describe('Manual Mode - Voice Selected', () => {
    const manualVoiceSettings: ChannelAssignmentSettings = {
      smartMode: false,
      manualChannel: 'voice',
    };

    it('should assign voice to all standard reminders when voice is selected', () => {
      const reminderTypes = [
        '30_days_before',
        '15_days_before',
        '7_days_before',
        '5_days_before',
        '3_days_before',
        '1_day_before',
        'on_due_date',
        '1_day_overdue',
        '3_days_overdue',
        '7_days_overdue',
      ];

      reminderTypes.forEach((type) => {
        const channel = assignChannel(type, manualVoiceSettings);
        expect(channel).toBe('voice');
      });
    });

    it('should assign voice to custom reminders when voice is selected', () => {
      const customTypes = [
        'custom_10_days_before',
        'custom_3_days_before',
        'custom_on_due_date',
        'custom_5_days_overdue',
      ];

      customTypes.forEach((type) => {
        const channel = assignChannel(type, manualVoiceSettings);
        expect(channel).toBe('voice');
      });
    });

    it('should assign voice to unknown reminder types when voice is selected', () => {
      const channel = assignChannel('unknown_type', manualVoiceSettings);
      expect(channel).toBe('voice');
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary case: 4 days before (should be SMS in smart mode)', () => {
      const settings: ChannelAssignmentSettings = {
        smartMode: true,
        manualChannel: 'voice',
      };
      
      // 4 days is not in standard list, but custom_4_days_before should be SMS (>= 5 days)
      // Actually, 4 days is less than 5, so it should be voice
      const channel = assignChannel('custom_4_days_before', settings);
      expect(channel).toBe('voice');
    });

    it('should handle exact boundary: custom 5 days before (should be SMS)', () => {
      const settings: ChannelAssignmentSettings = {
        smartMode: true,
        manualChannel: 'voice',
      };
      
      const channel = assignChannel('custom_5_days_before', settings);
      expect(channel).toBe('sms');
    });

    it('should handle case sensitivity in reminder types', () => {
      const settings: ChannelAssignmentSettings = {
        smartMode: true,
        manualChannel: 'voice',
      };
      
      // Reminder types should be lowercase, uppercase should default to voice
      const channel = assignChannel('7_DAYS_BEFORE', settings);
      expect(channel).toBe('voice');
    });
  });
});
