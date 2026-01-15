import { NextResponse } from "next/server";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    // Get the most recent reminder activity
    const recentReminders = await db
      .select()
      .from(reminders)
      .orderBy(desc(reminders.updatedAt))
      .limit(5);

    const lastProcessedReminder = recentReminders.find(r => 
      r.status === 'completed' || r.status === 'failed'
    );

    return NextResponse.json({
      success: true,
      lastCronRun: lastProcessedReminder?.updatedAt || null,
      recentActivity: recentReminders.length,
      status: 'healthy'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check cron status',
      status: 'unhealthy'
    }, { status: 500 });
  }
}