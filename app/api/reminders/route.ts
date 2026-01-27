import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { paymentReminders, invoicesCache, customersCache } from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
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
    const statuses = searchParams.get("statuses")?.split(",");
    const channel = searchParams.get("channel");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

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

    // Add multiple statuses filter if provided
    if (statuses && statuses.length > 0) {
      conditions.push(sql`${paymentReminders.status} IN ${statuses}`);
    }

    // Add channel filter if provided
    if (channel) {
      conditions.push(eq(paymentReminders.channel, channel));
    }

    // Fetch reminders with invoice details
    const reminders = await db
      .select({
        id: paymentReminders.id,
        reminderType: paymentReminders.reminderType,
        scheduledDate: paymentReminders.scheduledDate,
        status: paymentReminders.status,
        channel: paymentReminders.channel,
        externalId: paymentReminders.externalId,
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
          invoiceNumber: invoicesCache.invoiceNumber,
          amountTotal: invoicesCache.amountTotal,
          amountDue: invoicesCache.amountDue,
          currencyCode: invoicesCache.currencyCode,
          dueDate: invoicesCache.dueDate,
          status: invoicesCache.status,
        },
        // Customer details
        customer: {
          name: customersCache.customerName,
          phone: customersCache.primaryPhone,
        },
      })
      .from(paymentReminders)
      .leftJoin(invoicesCache, eq(paymentReminders.invoiceId, invoicesCache.id))
      .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
      .where(and(...conditions))
      .orderBy(desc(paymentReminders.scheduledDate))
      .limit(limit || 50); // Default to 50 if no limit provided to prevent overfetching

    // Parse JSON fields and format response
    const formattedReminders = reminders.map((reminder) => ({
      id: reminder.id,
      reminderType: reminder.reminderType,
      scheduledDate: reminder.scheduledDate,
      status: reminder.status,
      channel: reminder.channel,
      externalId: reminder.externalId,
      attemptCount: reminder.attemptCount,
      lastAttemptAt: reminder.lastAttemptAt,
      callOutcome: reminder.callOutcome ? JSON.parse(reminder.callOutcome) : null,
      skipReason: reminder.skipReason,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      invoice: {
        invoiceNumber: reminder.invoice?.invoiceNumber || "",
        customerName: reminder.customer?.name || "Unknown Customer",
        amountDue: parseFloat(reminder.invoice?.amountDue || "0"),
        currencyCode: reminder.invoice?.currencyCode || "USD",
        dueDate: reminder.invoice?.dueDate || "",
      },
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
