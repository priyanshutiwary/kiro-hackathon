"use client";


import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardTheme } from "@/lib/dashboard-theme";
import { Loader2, RefreshCw, AlertCircle, Calendar } from "lucide-react";

import { ScheduledRemindersTable } from "@/app/dashboard/scheduled/_components/scheduled-reminders-table";

export interface ScheduledReminder {

    id: number;
    invoiceId: number;
    reminderType: string;
    scheduledDate: string;
    status: string;
    channel: string;
    externalId: string | null;
    attemptCount: number;
    lastAttemptAt: string | null;
    skipReason: string | null;
    invoice: {
        invoiceNumber: string;
        customerName: string;
        amountDue: number;
        dueDate: string;
    };
}

interface ScheduledRemindersViewProps {
    reminders: ScheduledReminder[];
    loading: boolean;
    error: string | null;
    refreshing: boolean;
    onRefresh: () => void;
}

export function ScheduledRemindersView({
    reminders,
    loading,
    error,
    refreshing,
    onRefresh,
}: ScheduledRemindersViewProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading scheduled reminders...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6">


            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Scheduled Reminders List */}
            <section className={DashboardTheme.layout.sectionAnimateInDelayed}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mb-2">
                    <div>
                        <h2 className={DashboardTheme.typography.sectionTitle}>Upcoming Calls</h2>
                        <p className={DashboardTheme.typography.subtext}>
                            {reminders.length > 0
                                ? `${reminders.length} reminder${reminders.length !== 1 ? "s" : ""} scheduled`
                                : "No scheduled reminders found"}
                        </p>
                    </div>
                    <Button
                        onClick={onRefresh}
                        disabled={refreshing}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                    >

                        <RefreshCw
                            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                        />
                        <span className="sr-only">Refresh</span>
                    </Button>
                </div>

                {reminders.length > 0 ? (
                    <ScheduledRemindersTable reminders={reminders} />
                ) : (
                    <Card className={DashboardTheme.card.dashed}>
                        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="bg-muted p-4 rounded-full mb-4">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No scheduled reminders found</h3>
                            <p className="text-muted-foreground max-w-sm mb-4">
                                Reminders will appear here once invoices are synced and scheduled
                            </p>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                If you haven&apos;t set up any integrations yet, check your{" "}
                                <a href="/dashboard/settings?tab=integrations" className="text-primary underline hover:no-underline">
                                    integration settings
                                </a>{" "}
                                to connect your accounting software.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </section>
        </div>
    );
}
