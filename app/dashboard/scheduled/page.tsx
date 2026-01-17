"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardTheme } from "@/lib/dashboard-theme";
import { Loader2, RefreshCw, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ScheduledRemindersTable } from "./_components/scheduled-reminders-table";

interface ScheduledReminder {
  id: number;
  invoiceId: number;
  reminderType: string;
  scheduledDate: string;
  status: string;
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

export default function ScheduledPage() {
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledReminders(true);
  }, []);

  const fetchScheduledReminders = async (shouldLoad = false) => {
    try {
      if (shouldLoad) setLoading(true);
      setError(null);
      // Use the dedicated scheduled reminders endpoint
      const response = await fetch("/api/reminders/scheduled");

      if (!response.ok) {
        throw new Error("Failed to fetch scheduled reminders");
      }

      const data = await response.json();
      setReminders(data.reminders || []);
    } catch (error) {
      console.error("Error fetching scheduled reminders:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch scheduled reminders";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (shouldLoad) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchScheduledReminders(false);
    setRefreshing(false);
    toast.success("Scheduled reminders refreshed");
  };

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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          {/* Header removed */}
        </div>
        <Button
          onClick={handleRefresh}
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {reminders.length > 0 && (
        <div className={DashboardTheme.layout.gridcols3 + " md:grid-cols-4 mb-6"}>
          <Card className={DashboardTheme.card.base}>
            <CardHeader className={DashboardTheme.card.content + " py-4"}>
              <CardDescription className={DashboardTheme.card.metricLabel}>Total Scheduled</CardDescription>
              <CardTitle className={DashboardTheme.card.metricValue}>{reminders.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={DashboardTheme.card.base}>
            <CardHeader className={DashboardTheme.card.content + " py-4"}>
              <CardDescription className={DashboardTheme.card.metricLabel}>Today</CardDescription>
              <CardTitle className={DashboardTheme.card.metricValue}>
                {reminders.filter(r => {
                  const scheduledDate = new Date(r.scheduledDate);
                  const today = new Date();
                  return scheduledDate.toDateString() === today.toDateString();
                }).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className={DashboardTheme.card.base}>
            <CardHeader className={DashboardTheme.card.content + " py-4"}>
              <CardDescription className={DashboardTheme.card.metricLabel}>Pending</CardDescription>
              <CardTitle className={DashboardTheme.card.metricValue}>
                {reminders.filter(r => r.status === "pending").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className={DashboardTheme.card.base}>
            <CardHeader className={DashboardTheme.card.content + " py-4"}>
              <CardDescription className={DashboardTheme.card.metricLabel}>Queued</CardDescription>
              <CardTitle className={DashboardTheme.card.metricValue}>
                {reminders.filter(r => r.status === "queued").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
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
                If you haven't set up any integrations yet, check your{" "}
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