"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { RemindersTable } from "./_components/reminders-table";
import { ReminderFilters } from "./_components/reminder-filters";
import { DashboardTheme } from "@/lib/dashboard-theme";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduledRemindersView, ScheduledReminder } from "./_components/scheduled-view";


interface Reminder {
  id: number;
  invoiceId: number;
  reminderType: string;
  scheduledDate: string;
  status: string;
  channel: string;
  externalId: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  callOutcome: {
    connected: boolean;
    duration: number;
    customerResponse: string;
    notes?: string;
  } | null;
  skipReason: string | null;
  invoice: {
    invoiceNumber: string;
    customerName: string;
    amountDue: number;
    dueDate: string;
  };
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scheduled Reminders State
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [scheduledError, setScheduledError] = useState<string | null>(null);
  const [scheduledRefreshing, setScheduledRefreshing] = useState(false);


  // Filter states
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  useEffect(() => {
    fetchAllData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusFilter, channelFilter]);

  const fetchAllData = async (shouldLoad = false) => {
    try {
      if (shouldLoad) setLoading(true);
      setError(null);

      await Promise.all([
        fetchReminders(),
        fetchScheduledReminders(true)
      ]);

    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (shouldLoad) setLoading(false);
    }
  };

  const fetchReminders = async () => {
    const params = new URLSearchParams();

    if (dateRange.from) {
      params.append("startDate", dateRange.from.toISOString());
    }
    if (dateRange.to) {
      params.append("endDate", dateRange.to.toISOString());
    }
    if (statusFilter !== "all") {
      params.append("status", statusFilter);
    } else {
      // If "all" is selected in History tab, we still want to filter OUT pending/queued
      // So we explicitly ask for the "history" statuses
      params.append("statuses", "completed,failed,skipped,cancelled,in_progress");
    }
    if (channelFilter !== "all") {
      params.append("channel", channelFilter);
    }

    const response = await fetch(`/api/reminders?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch reminders");
    }

    const data = await response.json();
    setReminders(data.reminders || []);
    setReminders(data.reminders || []);
  };

  const fetchScheduledReminders = async (isInitial = false) => {
    try {
      if (isInitial) setScheduledLoading(true);
      setScheduledError(null);
      const response = await fetch("/api/reminders/scheduled");

      if (!response.ok) {
        throw new Error("Failed to fetch scheduled reminders");
      }

      const data = await response.json();
      setScheduledReminders(data.reminders || []);
    } catch (error) {
      console.error("Error fetching scheduled reminders:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch scheduled reminders";
      setScheduledError(errorMessage);
      if (!isInitial) toast.error(errorMessage);
    } finally {
      if (isInitial) setScheduledLoading(false);
    }
  };

  const handleScheduledRefresh = async () => {
    setScheduledRefreshing(true);
    await fetchScheduledReminders(false);
    setScheduledRefreshing(false);
    toast.success("Scheduled reminders refreshed");
  };


  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData(false);
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleDateRangeChange = (from: Date | null, to: Date | null) => {
    setDateRange({ from, to });
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleChannelFilterChange = (channel: string) => {
    setChannelFilter(channel);
  };

  return (
    <div className={DashboardTheme.layout.container}>
      <Tabs defaultValue="history" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history" className="space-y-4">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Content Section */}
          <section className={`${DashboardTheme.layout.sectionAnimateInDelayed} space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
              <div>
                <h2 className={DashboardTheme.typography.sectionTitle}>Reminder History</h2>
                <p className={DashboardTheme.typography.subtext}>
                  {reminders.length > 0
                    ? `${reminders.length} ${reminders.length === 1 ? "record" : "records"} found`
                    : "No reminder history"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ReminderFilters
                  dateRange={dateRange}
                  statusFilter={statusFilter}
                  channelFilter={channelFilter}
                  onDateRangeChange={handleDateRangeChange}
                  onStatusFilterChange={handleStatusFilterChange}
                  onChannelFilterChange={handleChannelFilterChange}
                />
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
                  <span className="sr-only">Refresh Data</span>
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading history...</p>
                </div>
              </div>
            ) : reminders.length > 0 ? (
              <RemindersTable reminders={reminders} />
            ) : !error ? (
              <Card className={DashboardTheme.card.dashed}>
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="bg-muted p-4 rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No reminder history</h3>
                  <p className="text-muted-foreground max-w-sm mb-4">
                    There are no past reminders matching your current filters.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setDateRange({ from: null, to: null });
                    setStatusFilter("all");
                    setChannelFilter("all");
                  }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </section>
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledRemindersView
            reminders={scheduledReminders}
            loading={scheduledLoading}
            error={scheduledError}
            refreshing={scheduledRefreshing}
            onRefresh={handleScheduledRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
