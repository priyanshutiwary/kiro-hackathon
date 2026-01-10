import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { paymentReminders, invoicesCache } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/reminders
 * Fetches reminders for current user with optional filtering
 * Requirements: 18.1, 18.2, 18.5, 18.6
 */
export async function GET(request: Request) {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = result.session.userId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Build query conditions
    const conditions = [eq(paymentReminders.userId, userId)];

    // Add date range filter if provided
    if (startDate) {
      conditions.push(gte(paymentReminders.scheduledDate, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(paymentReminders.scheduledDate, new Date(endDate)));
    }

    // Add status filter if provided
    if (status) {
      conditions.push(eq(paymentReminders.status, status));
    }

    // Fetch reminders with invoice details
    const reminders = await db
      .select({
        id: paymentReminders.id,
        reminderType: paymentReminders.reminderType,
        scheduledDate: paymentReminders.scheduledDate,
        status: paymentReminders.status,
        attemptCount: paymentReminders.attemptCount,
        lastAttemptAt: paymentReminders.lastAttemptAt,
        callOutcome: paymentReminders.callOutcome,
        skipReason: paymentReminders.skipReason,
        createdAt: paymentReminders.createdAt,
        updatedAt: paymentReminders.updatedAt,
        // Invoice details
        invoice: {
          id: invoicesCache.id,
          zohoInvoiceId: invoicesCache.zohoInvoiceId,
          customerName: invoicesCache.customerName,
          customerPhone: invoicesCache.customerPhone,
          invoiceNumber: invoicesCache.invoiceNumber,
          amountTotal: invoicesCache.amountTotal,
          amountDue: invoicesCache.amountDue,
          dueDate: invoicesCache.dueDate,
          status: invoicesCache.status,
        },
      })
      .from(paymentReminders)
      .leftJoin(invoicesCache, eq(paymentReminders.invoiceId, invoicesCache.id))
      .where(and(...conditions))
      .orderBy(desc(paymentReminders.scheduledDate));

    // Parse JSON fields
    const formattedReminders = reminders.map((reminder) => ({
      ...reminder,
      callOutcome: reminder.callOutcome ? JSON.parse(reminder.callOutcome) : null,
    }));

    return NextResponse.json({
      reminders: formattedReminders,
      count: formattedReminders.length,
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
