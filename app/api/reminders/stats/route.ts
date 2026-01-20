import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { paymentReminders } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/reminders/stats
 * Calculate reminder success rates and statistics
 * Requirements: 18.3
 */

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = result.session.userId;

    // Get overall statistics
    const overallStats = await db
      .select({
        status: paymentReminders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(paymentReminders)
      .where(eq(paymentReminders.userId, userId))
      .groupBy(paymentReminders.status);

    // Calculate totals
    const totalReminders = overallStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedReminders = overallStats.find((s) => s.status === "completed")?.count || 0;
    const skippedReminders = overallStats.find((s) => s.status === "skipped")?.count || 0;
    const failedReminders = overallStats.find((s) => s.status === "failed")?.count || 0;
    const pendingReminders = overallStats.find((s) => s.status === "pending")?.count || 0;
    const queuedReminders = overallStats.find((s) => s.status === "queued")?.count || 0;
    const inProgressReminders = overallStats.find((s) => s.status === "in_progress")?.count || 0;

    // Calculate success rate (completed / (completed + failed))
    const attemptedReminders = completedReminders + failedReminders;
    const successRate = attemptedReminders > 0 
      ? (completedReminders / attemptedReminders) * 100 
      : 0;

    // Get call outcome statistics for completed reminders
    const completedWithOutcomes = await db
      .select({
        callOutcome: paymentReminders.callOutcome,
      })
      .from(paymentReminders)
      .where(
        and(
          eq(paymentReminders.userId, userId),
          eq(paymentReminders.status, "completed")
        )
      );

    // Parse and count customer responses
    const responseStats: Record<string, number> = {
      will_pay_today: 0,
      already_paid: 0,
      dispute: 0,
      no_answer: 0,
      other: 0,
    };

    completedWithOutcomes.forEach((reminder) => {
      if (reminder.callOutcome) {
        try {
          const outcome = JSON.parse(reminder.callOutcome);
          const response = outcome.customerResponse || "other";
          if (response in responseStats) {
            responseStats[response]++;
          } else {
            responseStats.other++;
          }
        } catch {
          // Invalid JSON, count as other
          responseStats.other++;
        }
      }
    });

    // Get statistics by reminder type
    const typeStats = await db
      .select({
        reminderType: paymentReminders.reminderType,
        status: paymentReminders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(paymentReminders)
      .where(eq(paymentReminders.userId, userId))
      .groupBy(paymentReminders.reminderType, paymentReminders.status);

    // Format type statistics
    const typeStatsFormatted = typeStats.reduce((acc, stat) => {
      if (!acc[stat.reminderType]) {
        acc[stat.reminderType] = {
          total: 0,
          completed: 0,
          failed: 0,
          skipped: 0,
          pending: 0,
        };
      }
      acc[stat.reminderType].total += stat.count;
      if (stat.status === "completed") {
        acc[stat.reminderType].completed = stat.count;
      } else if (stat.status === "failed") {
        acc[stat.reminderType].failed = stat.count;
      } else if (stat.status === "skipped") {
        acc[stat.reminderType].skipped = stat.count;
      } else if (stat.status === "pending") {
        acc[stat.reminderType].pending = stat.count;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number; failed: number; skipped: number; pending: number }>);

    return NextResponse.json({
      overall: {
        total: totalReminders,
        completed: completedReminders,
        skipped: skippedReminders,
        failed: failedReminders,
        pending: pendingReminders,
        queued: queuedReminders,
        inProgress: inProgressReminders,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      },
      customerResponses: responseStats,
      byReminderType: typeStatsFormatted,
    });
  } catch (error) {
    console.error("Error fetching reminder statistics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reminder statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
