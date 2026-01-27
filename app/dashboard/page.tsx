"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DashboardStats } from "./_components/dashboard-stats";

import { useRouter } from "next/navigation";
import { DashboardTheme } from "@/lib/dashboard-theme";
import { RecentActivity } from "./_components/recent-activity";


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
  byChannel: {
    smsCount: number;
    voiceCount: number;
    completedSMS: number;
    completedVoice: number;
    failedSMS: number;
    failedVoice: number;
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
    <div className={DashboardTheme.layout.container}>
      <div className={DashboardTheme.layout.sectionAnimateInDelayed}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mb-2">
          <div>
            {/* <h2 className={DashboardTheme.typography.sectionTitle}>Dashboard Overview</h2>
            <p className={DashboardTheme.typography.subtext}>
              Monitor your automated payment reminder performance and analytics.
            </p> */}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="icon"
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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

        <div className="flex flex-col gap-4 py-4 md:gap-6">
          {stats && <DashboardStats stats={stats} />}

          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
