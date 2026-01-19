import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { paymentReminders, invoicesCache, customersCache } from "@/db/schema";
import { eq, and, or, asc } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/reminders/scheduled
 * Fetches scheduled reminders (pending and queued) for current user
 */
export async function GET(_request: NextRequest) {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = result.session.userId;

    // Fetch scheduled reminders (pending and queued) with invoice and customer details
    const reminders = await db
      .select({
        id: paymentReminders.id,
        invoiceId: paymentReminders.invoiceId,
        reminderType: paymentReminders.reminderType,
        scheduledDate: paymentReminders.scheduledDate,
        status: paymentReminders.status,
        attemptCount: paymentReminders.attemptCount,
        lastAttemptAt: paymentReminders.lastAttemptAt,
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
      .where(
        and(
          eq(paymentReminders.userId, userId),
          or(
            eq(paymentReminders.status, "pending"),
            eq(paymentReminders.status, "queued")
          )
        )
      )
      .orderBy(asc(paymentReminders.scheduledDate));

    // Format the response to match the expected structure
    const formattedReminders = reminders.map((reminder) => ({
      id: reminder.id,
      invoiceId: reminder.invoiceId,
      reminderType: reminder.reminderType,
      scheduledDate: reminder.scheduledDate,
      status: reminder.status,
      attemptCount: reminder.attemptCount,
      lastAttemptAt: reminder.lastAttemptAt,
      skipReason: reminder.skipReason,
      invoice: {
        invoiceNumber: reminder.invoice?.invoiceNumber || "",
        customerName: reminder.customer?.name || "Unknown Customer",
        amountDue: parseFloat(reminder.invoice?.amountDue || "0"),
        dueDate: reminder.invoice?.dueDate || "",
      },
    }));

    return NextResponse.json({
      reminders: formattedReminders,
      count: formattedReminders.length,
    });
  } catch (error) {
    console.error("Error fetching scheduled reminders:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch scheduled reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}