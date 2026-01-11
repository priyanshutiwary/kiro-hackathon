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
import { Loader2, RefreshCw, AlertCircle, Calendar, Clock } from "lucide-react";
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
    fetchScheduledReminders();
  }, []);

  const fetchScheduledReminders = async () => {
    try {
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
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchScheduledReminders();
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
        <div>
          <h1 className="text-3xl font-bold">Scheduled Reminders</h1>
          <p className="text-muted-foreground">
            View and manage upcoming payment reminder calls
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

      {/* Summary Cards */}
      {reminders.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Scheduled</CardDescription>
              <CardTitle className="text-2xl">{reminders.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today</CardDescription>
              <CardTitle className="text-2xl">
                {reminders.filter(r => {
                  const scheduledDate = new Date(r.scheduledDate);
                  const today = new Date();
                  return scheduledDate.toDateString() === today.toDateString();
                }).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl">
                {reminders.filter(r => r.status === "pending").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Queued</CardDescription>
              <CardTitle className="text-2xl">
                {reminders.filter(r => r.status === "queued").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Scheduled Reminders List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Calls
              </CardTitle>
              <CardDescription>
                {reminders.length > 0
                  ? `${reminders.length} reminder${reminders.length !== 1 ? "s" : ""} scheduled`
                  : "No scheduled reminders found"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length > 0 ? (
            <ScheduledRemindersTable reminders={reminders} />
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                No scheduled reminders found
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