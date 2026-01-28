import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { invoicesCache, paymentReminders, customersCache } from "@/db/schema";
import { eq, and, or, inArray, sql, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/invoices
 * Fetches invoices awaiting payment for current user with reminder status
 * Requirements: 18.4
 */
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

    // Fetch invoices awaiting payment (unpaid or partially_paid)
    const invoices = await db
      .select({
        id: invoicesCache.id,
        zohoInvoiceId: invoicesCache.zohoInvoiceId,
        customerId: invoicesCache.customerId,
        customerName: customersCache.customerName,
        customerPhone: customersCache.primaryPhone,
        invoiceNumber: invoicesCache.invoiceNumber,
        amountTotal: invoicesCache.amountTotal,
        amountDue: invoicesCache.amountDue,
        dueDate: invoicesCache.dueDate,
        status: invoicesCache.status,
        remindersCreated: invoicesCache.remindersCreated,
        createdAt: invoicesCache.createdAt,
        updatedAt: invoicesCache.updatedAt,
      })
      .from(invoicesCache)
      .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
      .where(
        and(
          eq(invoicesCache.userId, userId),
          or(
            eq(invoicesCache.status, "unpaid"),
            eq(invoicesCache.status, "partially_paid")
          )
        )
      )
      .orderBy(desc(invoicesCache.dueDate));

    // For each invoice, get reminder statistics
    const invoicesWithReminders = await Promise.all(
      invoices.map(async (invoice) => {
        // Get reminder counts by status
        const reminderStats = await db
          .select({
            status: paymentReminders.status,
            count: sql<number>`count(*)::int`,
          })
          .from(paymentReminders)
          .where(eq(paymentReminders.invoiceId, invoice.id))
          .groupBy(paymentReminders.status);

        // Get next scheduled reminder
        const nextReminder = await db
          .select({
            id: paymentReminders.id,
            reminderType: paymentReminders.reminderType,
            scheduledDate: paymentReminders.scheduledDate,
            status: paymentReminders.status,
          })
          .from(paymentReminders)
          .where(
            and(
              eq(paymentReminders.invoiceId, invoice.id),
              inArray(paymentReminders.status, ["pending", "queued"])
            )
          )
          .orderBy(paymentReminders.scheduledDate)
          .limit(1);

        // Get last completed reminder
        const lastReminder = await db
          .select({
            id: paymentReminders.id,
            reminderType: paymentReminders.reminderType,
            scheduledDate: paymentReminders.scheduledDate,
            status: paymentReminders.status,
            lastAttemptAt: paymentReminders.lastAttemptAt,
            callOutcome: paymentReminders.callOutcome,
          })
          .from(paymentReminders)
          .where(
            and(
              eq(paymentReminders.invoiceId, invoice.id),
              inArray(paymentReminders.status, ["completed", "failed", "skipped"])
            )
          )
          .orderBy(desc(paymentReminders.lastAttemptAt))
          .limit(1);

        // Format reminder statistics
        const stats = {
          total: reminderStats.reduce((sum, stat) => sum + stat.count, 0),
          pending: reminderStats.find((s) => s.status === "pending")?.count || 0,
          completed: reminderStats.find((s) => s.status === "completed")?.count || 0,
          failed: reminderStats.find((s) => s.status === "failed")?.count || 0,
          skipped: reminderStats.find((s) => s.status === "skipped")?.count || 0,
        };

        return {
          ...invoice,
          reminderStats: stats,
          nextReminder: nextReminder[0] || null,
          lastReminder: lastReminder[0]
            ? {
                ...lastReminder[0],
                callOutcome: lastReminder[0].callOutcome
                  ? JSON.parse(lastReminder[0].callOutcome)
                  : null,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      invoices: invoicesWithReminders,
      count: invoicesWithReminders.length,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
