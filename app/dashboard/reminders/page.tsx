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

      await fetchReminders();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={DashboardTheme.layout.container}>
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
            <h2 className={DashboardTheme.typography.sectionTitle}>Scheduled Calls</h2>
            <p className={DashboardTheme.typography.subtext}>
              {reminders.length > 0
                ? `${reminders.length} ${reminders.length === 1 ? "call" : "calls"} found matching your criteria`
                : "No reminders scheduled"}
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

        {reminders.length > 0 ? (
          <RemindersTable reminders={reminders} />
        ) : !error ? (
          <Card className={DashboardTheme.card.dashed}>
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="bg-muted p-4 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No reminders found</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                There are no reminders matching your current filters. Try adjusting dates or status.
              </p>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                If you haven&apos;t set up any integrations yet, check your{" "}
                <a href="/dashboard/settings?tab=integrations" className="text-primary underline hover:no-underline">
                  integration settings
                </a>{" "}
                to connect your accounting software.
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
    </div>
  );
}
