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
import { Loader2, RefreshCw, AlertCircle, Calendar, Phone } from "lucide-react";
import { toast } from "sonner";
import { RemindersTable } from "./_components/reminders-table";
import { ReminderStats } from "./_components/reminder-stats";
import { InvoicesAwaitingPayment } from "./_components/invoices-awaiting-payment";
import { ReminderFilters } from "./_components/reminder-filters";

interface Reminder {
  id: number;
  invoiceId: number;
  reminderType: string;
  scheduledDate: string;
  status: string;
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

interface ReminderStatsData {
  overall: {
    total: number;
    completed: number;
    skipped: number;
    failed: number;
    pending: number;
    queued: number;
    inProgress: number;
    successRate: number;
  };
  customerResponses: Record<string, number>;
  byReminderType: Record<string, {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    pending: number;
  }>;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  amountDue: number;
  dueDate: string;
  status: string;
  remindersCreated: boolean;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStatsData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchAllData();
  }, [dateRange, statusFilter]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchReminders(),
        fetchStats(),
        fetchInvoices(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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

    const response = await fetch(`/api/reminders?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch reminders");
    }

    const data = await response.json();
    setReminders(data.reminders || []);
  };

  const fetchStats = async () => {
    const response = await fetch("/api/reminders/stats");
    
    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    const data = await response.json();
    setStats(data);
  };

  const fetchInvoices = async () => {
    const response = await fetch("/api/invoices");
    
    if (!response.ok) {
      throw new Error("Failed to fetch invoices");
    }

    const data = await response.json();
    setInvoices(data.invoices || []);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleDateRangeChange = (from: Date | null, to: Date | null) => {
    setDateRange({ from, to });
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Reminders</h1>
          <p className="text-muted-foreground">
            Monitor and manage automated payment reminder calls
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="mb-6">
          <ReminderStats stats={stats} />
        </div>
      )}

      {/* Invoices Awaiting Payment */}
      {invoices.length > 0 && (
        <div className="mb-6">
          <InvoicesAwaitingPayment invoices={invoices} />
        </div>
      )}

      {/* Reminders List with Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Reminder Calls
              </CardTitle>
              <CardDescription>
                {reminders.length > 0
                  ? `Showing ${reminders.length} reminder${reminders.length !== 1 ? "s" : ""}`
                  : "No reminders found"}
              </CardDescription>
            </div>
            <ReminderFilters
              dateRange={dateRange}
              statusFilter={statusFilter}
              onDateRangeChange={handleDateRangeChange}
              onStatusFilterChange={handleStatusFilterChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length > 0 ? (
            <RemindersTable reminders={reminders} />
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                No reminders found
              </p>
              <p className="text-sm text-muted-foreground">
                Reminders will appear here once invoices are synced and scheduled
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
