"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ReminderStats } from "./reminders/_components/reminder-stats";
import { ChartAreaInteractive } from "./_components/chart-interactive";
import { useRouter } from "next/navigation";

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

export default function Dashboard() {
  const [stats, setStats] = useState<ReminderStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/reminders/stats");
      
      if (response.status === 401) {
        router.push("/sign-in");
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch reminder stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch stats";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success("Stats refreshed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col items-start justify-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Payment Reminders Overview
            </h1>
            <p className="text-muted-foreground">
              Monitor your automated payment reminder performance and analytics.
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

        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {stats && <ReminderStats stats={stats} />}
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </section>
  );
}
