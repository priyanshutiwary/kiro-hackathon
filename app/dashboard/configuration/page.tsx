"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Phone, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReminderSettings {
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

export default function ConfigurationPage() {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [customDayInput, setCustomDayInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch reminder settings
        const reminderResponse = await fetch("/api/reminder-settings");
        if (reminderResponse.ok) {
          const reminderData = await reminderResponse.json();
          setReminderSettings(reminderData);
        }

        // Fetch timezones
        const timezonesResponse = await fetch("/api/reminder-settings/timezones");
        if (timezonesResponse.ok) {
          const timezonesData = await timezonesResponse.json();
          setTimezones(timezonesData.timezones || []);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error("Failed to load configuration");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateReminderSettings = (): boolean => {
    const errors: string[] = [];

    if (!reminderSettings) {
      errors.push("Settings not loaded");
      setValidationErrors(errors);
      return false;
    }

    // Validate time range
    const startMinutes = timeToMinutes(reminderSettings.callStartTime);
    const endMinutes = timeToMinutes(reminderSettings.callEndTime);
    if (startMinutes >= endMinutes) {
      errors.push("Call start time must be before call end time");
    }

    // Validate days of week
    if (reminderSettings.callDaysOfWeek.length === 0) {
      errors.push("At least one call day must be selected");
    }

    // Validate retry attempts
    if (reminderSettings.maxRetryAttempts < 0 || reminderSettings.maxRetryAttempts > 10) {
      errors.push("Maximum retry attempts must be between 0 and 10");
    }

    // Validate retry delay
    if (reminderSettings.retryDelayHours < 1 || reminderSettings.retryDelayHours > 48) {
      errors.push("Retry delay must be between 1 and 48 hours");
    }

    // Validate custom reminder days
    for (const day of reminderSettings.customReminderDays) {
      if (day === 0 || day < -30 || day > 30) {
        errors.push("Custom reminder days must be between -30 and 30 (excluding 0)");
        break;
      }
    }

    // Validate language
    const validLanguages = ['en', 'hi', 'hinglish'];
    if (reminderSettings.language && !validLanguages.includes(reminderSettings.language)) {
      errors.push("Invalid language selection");
    }

    // Validate voice gender
    const validVoiceGenders = ['male', 'female'];
    if (reminderSettings.voiceGender && !validVoiceGenders.includes(reminderSettings.voiceGender)) {
      errors.push("Invalid voice gender selection");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSaveReminderSettings = async () => {
    if (!reminderSettings) return;

    setValidationErrors([]);

    if (!validateReminderSettings()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setSavingSettings(true);
    try {
      const response = await fetch("/api/reminder-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminderSettings),
      });

      if (response.ok) {
        const data = await response.json();
        setReminderSettings(data.settings);
        toast.success("Configuration saved successfully");
      } else {
        const error = await response.json();
        const errorMessages = error.details || [error.error || "Failed to save settings"];
        setValidationErrors(errorMessages);
        toast.error(errorMessages[0]);
      }
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCustomDay = () => {
    if (!reminderSettings || !customDayInput) return;

    const day = parseInt(customDayInput);
    if (isNaN(day) || day === 0 || day < -30 || day > 30) {
      toast.error("Custom day must be between -30 and 30 (excluding 0)");
      return;
    }

    if (reminderSettings.customReminderDays.includes(day)) {
      toast.error("This custom day already exists");
      return;
    }

    setReminderSettings({
      ...reminderSettings,
      customReminderDays: [...reminderSettings.customReminderDays, day].sort((a, b) => b - a),
    });
    setCustomDayInput("");
  };

  const handleRemoveCustomDay = (day: number) => {
    if (!reminderSettings) return;

    setReminderSettings({
      ...reminderSettings,
      customReminderDays: reminderSettings.customReminderDays.filter(d => d !== day),
    });
  };

  const handleToggleDayOfWeek = (day: number) => {
    if (!reminderSettings) return;

    const days = reminderSettings.callDaysOfWeek;
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day].sort();

    setReminderSettings({
      ...reminderSettings,
      callDaysOfWeek: newDays,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure payment reminder call settings
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Reminder Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reminder Schedule
            </CardTitle>
            <CardDescription>
              Configure when payment reminders are sent to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Standard Reminders</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder30"
                    checked={reminderSettings?.reminder30DaysBefore || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder30DaysBefore: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder30" className="font-normal cursor-pointer">
                    30 days before due date
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder15"
                    checked={reminderSettings?.reminder15DaysBefore || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder15DaysBefore: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder15" className="font-normal cursor-pointer">
                    15 days before due date
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder7"
                    checked={reminderSettings?.reminder7DaysBefore || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder7DaysBefore: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder7" className="font-normal cursor-pointer">
                    7 days before due date
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder5"
                    checked={reminderSettings?.reminder5DaysBefore || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder5DaysBefore: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder5" className="font-normal cursor-pointer">
                    5 days before due date
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder3"
                    checked={reminderSettings?.reminder3DaysBefore || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder3DaysBefore: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder3" className="font-normal cursor-pointer">
                    3 days before due date
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder1"
                    checked={reminderSettings?.reminder1DayBefore || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder1DayBefore: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder1" className="font-normal cursor-pointer">
                    1 day before due date
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminderDue"
                    checked={reminderSettings?.reminderOnDueDate || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminderOnDueDate: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminderDue" className="font-normal cursor-pointer">
                    On due date
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder1Overdue"
                    checked={reminderSettings?.reminder1DayOverdue || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder1DayOverdue: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder1Overdue" className="font-normal cursor-pointer">
                    1 day overdue
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder3Overdue"
                    checked={reminderSettings?.reminder3DaysOverdue || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder3DaysOverdue: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder3Overdue" className="font-normal cursor-pointer">
                    3 days overdue
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder7Overdue"
                    checked={reminderSettings?.reminder7DaysOverdue || false}
                    onCheckedChange={(checked) =>
                      setReminderSettings(prev => prev ? { ...prev, reminder7DaysOverdue: checked as boolean } : null)
                    }
                  />
                  <Label htmlFor="reminder7Overdue" className="font-normal cursor-pointer">
                    7 days overdue
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Custom Reminder Days</Label>
              <p className="text-sm text-muted-foreground">
                Add custom reminder days as offsets from due date. Positive numbers are days before due date, negative numbers are days after (overdue).
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="e.g., 10 or -5"
                  value={customDayInput}
                  onChange={(e) => setCustomDayInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomDay();
                    }
                  }}
                />
                <Button onClick={handleAddCustomDay} variant="outline">
                  Add
                </Button>
              </div>
              {reminderSettings?.customReminderDays && reminderSettings.customReminderDays.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reminderSettings.customReminderDays.map((day) => (
                    <Badge key={day} variant="secondary" className="gap-1">
                      {day > 0 ? `${day} days before` : `${Math.abs(day)} days after`}
                      <button
                        onClick={() => handleRemoveCustomDay(day)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Call Timing
            </CardTitle>
            <CardDescription>
              Configure when calls can be made to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={reminderSettings?.callTimezone || "UTC"}
                onValueChange={(value) =>
                  setReminderSettings(prev => prev ? { ...prev, callTimezone: value } : null)
                }
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Call Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={reminderSettings?.callStartTime?.substring(0, 5) || "09:00"}
                  onChange={(e) => {
                    const timeValue = e.target.value;
                    setReminderSettings(prev => prev ? { ...prev, callStartTime: timeValue + ":00" } : null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Call End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={reminderSettings?.callEndTime?.substring(0, 5) || "18:00"}
                  onChange={(e) => {
                    const timeValue = e.target.value;
                    setReminderSettings(prev => prev ? { ...prev, callEndTime: timeValue + ":00" } : null);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Call Days</Label>
              <p className="text-sm text-muted-foreground">
                Select which days of the week calls can be made
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 0, label: "Sunday" },
                  { value: 1, label: "Monday" },
                  { value: 2, label: "Tuesday" },
                  { value: 3, label: "Wednesday" },
                  { value: 4, label: "Thursday" },
                  { value: 5, label: "Friday" },
                  { value: 6, label: "Saturday" },
                ].map((day) => (
                  <Button
                    key={day.value}
                    variant={reminderSettings?.callDaysOfWeek?.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleDayOfWeek(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice and Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Voice and Language Settings
            </CardTitle>
            <CardDescription>
              Configure the language and voice for payment reminder calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={reminderSettings?.language || "en"}
                  onValueChange={(value) =>
                    setReminderSettings(prev => prev ? { ...prev, language: value } : null)
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="hinglish">Hinglish</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Language for payment reminder calls
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voiceGender">Voice Gender</Label>
                <Select
                  value={reminderSettings?.voiceGender || "female"}
                  onValueChange={(value) =>
                    setReminderSettings(prev => prev ? { ...prev, voiceGender: value } : null)
                  }
                >
                  <SelectTrigger id="voiceGender">
                    <SelectValue placeholder="Select voice gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Voice gender for the AI agent
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retry Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Retry Settings
            </CardTitle>
            <CardDescription>
              Configure retry behavior for failed calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Maximum Retry Attempts</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min="0"
                  max="10"
                  value={reminderSettings?.maxRetryAttempts || 3}
                  onChange={(e) =>
                    setReminderSettings(prev => prev ? { ...prev, maxRetryAttempts: parseInt(e.target.value) } : null)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of times to retry a failed call (0-10)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryDelay">Retry Delay (hours)</Label>
                <Input
                  id="retryDelay"
                  type="number"
                  min="1"
                  max="48"
                  value={reminderSettings?.retryDelayHours || 2}
                  onChange={(e) =>
                    setReminderSettings(prev => prev ? { ...prev, retryDelayHours: parseInt(e.target.value) } : null)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Hours to wait between retry attempts (1-48)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveReminderSettings} disabled={savingSettings || !reminderSettings}>
            {savingSettings ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
