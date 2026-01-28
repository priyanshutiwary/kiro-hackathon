"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SettingsRow from "./settings-row";
import { cn } from "@/lib/utils";

interface ReminderSettings {
    userId: string;
    organizationId: string | null;
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
    callTimezone: string;
    callStartTime: string;
    callEndTime: string;
    callDaysOfWeek: number[];
    language: string;
    voiceGender: string;
    smartMode: boolean;
    manualChannel: 'sms' | 'voice';
    maxRetryAttempts: number;
    retryDelayHours: number;
}

export default function ReminderSettings() {
    const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
    const [timezones, setTimezones] = useState<string[]>([]);
    const [savingSettings, setSavingSettings] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const reminderResponse = await fetch("/api/reminder-settings");
                if (reminderResponse.ok) {
                    const reminderData = await reminderResponse.json();
                    setReminderSettings(reminderData);
                }
                const timezonesResponse = await fetch("/api/reminder-settings/timezones");
                if (timezonesResponse.ok) {
                    const timezonesData = await timezonesResponse.json();
                    setTimezones(timezonesData.timezones || []);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!reminderSettings) return;
        setSavingSettings(true);
        try {
            const response = await fetch("/api/reminder-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reminderSettings),
            });
            if (response.ok) toast.success("Settings saved");
            else toast.error("Failed to save");
        } catch {
            toast.error("Error saving settings");
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) return <div className="p-4 text-muted-foreground">Loading...</div>;
    if (!reminderSettings) return null;

    // Helper for pill buttons
    const ReminderPill = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
                active
                    ? "bg-primary/10 text-primary border-primary/50 shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
        >
            {label}
        </button>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1">
                <SettingsRow
                    label="Reminder Cadence"
                    description="Select days relative to the due date."
                >
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Before Due Date</span>
                            <div className="flex flex-wrap gap-2">
                                <ReminderPill
                                    label="30 Days"
                                    active={reminderSettings.reminder30DaysBefore}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder30DaysBefore: !reminderSettings.reminder30DaysBefore })}
                                />
                                <ReminderPill
                                    label="15 Days"
                                    active={reminderSettings.reminder15DaysBefore}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder15DaysBefore: !reminderSettings.reminder15DaysBefore })}
                                />
                                <ReminderPill
                                    label="7 Days"
                                    active={reminderSettings.reminder7DaysBefore}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder7DaysBefore: !reminderSettings.reminder7DaysBefore })}
                                />
                                <ReminderPill
                                    label="5 Days"
                                    active={reminderSettings.reminder5DaysBefore}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder5DaysBefore: !reminderSettings.reminder5DaysBefore })}
                                />
                                <ReminderPill
                                    label="3 Days"
                                    active={reminderSettings.reminder3DaysBefore}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder3DaysBefore: !reminderSettings.reminder3DaysBefore })}
                                />
                                <ReminderPill
                                    label="1 Day"
                                    active={reminderSettings.reminder1DayBefore}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder1DayBefore: !reminderSettings.reminder1DayBefore })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">On & After Due</span>
                            <div className="flex flex-wrap gap-2">
                                <ReminderPill
                                    label="Due Date"
                                    active={reminderSettings.reminderOnDueDate}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminderOnDueDate: !reminderSettings.reminderOnDueDate })}
                                />
                                <ReminderPill
                                    label="1 Day Overdue"
                                    active={reminderSettings.reminder1DayOverdue}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder1DayOverdue: !reminderSettings.reminder1DayOverdue })}
                                />
                                <ReminderPill
                                    label="3 Days Overdue"
                                    active={reminderSettings.reminder3DaysOverdue}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder3DaysOverdue: !reminderSettings.reminder3DaysOverdue })}
                                />
                                <ReminderPill
                                    label="7 Days Overdue"
                                    active={reminderSettings.reminder7DaysOverdue}
                                    onClick={() => setReminderSettings({ ...reminderSettings, reminder7DaysOverdue: !reminderSettings.reminder7DaysOverdue })}
                                />
                            </div>
                        </div>
                    </div>
                </SettingsRow>

                <SettingsRow label="Channel Strategy" description="How the agent contacts customers.">
                    <div className="space-y-4">
                        <div className="flex p-1 bg-muted/30 rounded-lg w-fit border border-border/50">
                            <button
                                type="button"
                                onClick={() => setReminderSettings({ ...reminderSettings, smartMode: true })}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                    reminderSettings.smartMode
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Smart Mode
                            </button>
                            <button
                                type="button"
                                onClick={() => setReminderSettings({ ...reminderSettings, smartMode: false })}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                    !reminderSettings.smartMode
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Manual Mode
                            </button>
                        </div>

                        {!reminderSettings.smartMode && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200 pl-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground">Channel:</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setReminderSettings({ ...reminderSettings, manualChannel: 'sms' })}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-sm transition-colors border",
                                                reminderSettings.manualChannel === 'sms'
                                                    ? "bg-primary/10 text-primary border-primary/20"
                                                    : "bg-background border-border hover:bg-muted"
                                            )}
                                        >
                                            SMS Only
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReminderSettings({ ...reminderSettings, manualChannel: 'voice' })}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-sm transition-colors border",
                                                reminderSettings.manualChannel === 'voice'
                                                    ? "bg-primary/10 text-primary border-primary/20"
                                                    : "bg-background border-border hover:bg-muted"
                                            )}
                                        >
                                            Voice Only
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {reminderSettings.smartMode && (
                            <p className="text-[13px] text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/30 max-w-lg">
                                <span className="font-semibold text-primary">AI Optimization:</span> Uses SMS for early reminders and Voice for urgent/overdue dates.
                            </p>
                        )}
                    </div>
                </SettingsRow>

                <SettingsRow label="Operational Hours" description="Set your local time window for calls." alignTop>
                    <div className="space-y-6">
                        {/* Timezone Selection */}
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timezone</span>
                            <Select value={reminderSettings.callTimezone} onValueChange={(v) => setReminderSettings({ ...reminderSettings, callTimezone: v })}>
                                <SelectTrigger className="w-full md:w-[280px] bg-background">
                                    <SelectValue placeholder="Select Timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Schedule Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Call Window</span>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                            <Sun className="w-4 h-4" />
                                        </div>
                                        <Input
                                            type="time"
                                            className="pl-10 h-10 bg-background"
                                            value={reminderSettings.callStartTime.substring(0, 5)}
                                            onChange={(e) => setReminderSettings({ ...reminderSettings, callStartTime: e.target.value + ":00" })}
                                        />
                                    </div>
                                    <span className="text-muted-foreground text-sm">-</span>
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                            <Moon className="w-4 h-4" />
                                        </div>
                                        <Input
                                            type="time"
                                            className="pl-10 h-10 bg-background"
                                            value={reminderSettings.callEndTime.substring(0, 5)}
                                            onChange={(e) => setReminderSettings({ ...reminderSettings, callEndTime: e.target.value + ":00" })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Days</span>
                                <div className="flex gap-1.5 flex-wrap">
                                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                const days = reminderSettings.callDaysOfWeek;
                                                const newDays = days.includes(idx) ? days.filter(d => d !== idx) : [...days, idx].sort();
                                                setReminderSettings({ ...reminderSettings, callDaysOfWeek: newDays });
                                            }}
                                            className={cn(
                                                "w-9 h-9 rounded-md text-sm font-medium flex items-center justify-center transition-all ring-1 ring-inset",
                                                reminderSettings.callDaysOfWeek.includes(idx)
                                                    ? "bg-primary/10 text-primary ring-primary/50 shadow-sm"
                                                    : "bg-background text-muted-foreground ring-border hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </SettingsRow>

                <SettingsRow label="Voice Settings" description="Configure the agent's persona.">
                    <div className="flex gap-3">
                        <Select value={reminderSettings.voiceGender} onValueChange={(v) => setReminderSettings({ ...reminderSettings, voiceGender: v })}>
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Gender" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="male">Male</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={reminderSettings.language} onValueChange={(v) => setReminderSettings({ ...reminderSettings, language: v })}>
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Language" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="hi">Hindi</SelectItem>
                                <SelectItem value="hinglish">Hinglish</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </SettingsRow>
            </div>

            <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
