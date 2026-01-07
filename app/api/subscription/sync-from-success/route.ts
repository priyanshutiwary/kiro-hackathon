import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { subscription, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSubscriptionFromDodo } from "@/lib/dodo-payments";

function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, status: statusFromQuery } = body || {};

    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 });
    }

    // Confirm user still exists (fetch email if needed)
    const users = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
    const currentUser = users[0];
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Try to fetch full subscription from Dodo Payments
    type MinimalDodoSub = {
      product_id?: string;
      amount?: number;
      currency?: string;
      recurring_interval?: string;
      status?: string;
      current_period_start?: string | Date | null;
      current_period_end?: string | Date | null;
      cancel_at_period_end?: boolean;
      canceled_at?: string | Date | null;
    };

    let dodoSub: Partial<MinimalDodoSub> | null = null;
    try {
      dodoSub = (await getSubscriptionFromDodo(subscriptionId)) as Partial<MinimalDodoSub>;
    } catch {
      // Proceed with fallback minimal info
    }

    const now = new Date();
    const productId = dodoSub?.product_id || process.env.NEXT_PUBLIC_STARTER_TIER || "pdt_gok24Vsklq5ghJL9Z96Ve";
    const amount = dodoSub?.amount ?? 1000; // cents
    const currency = dodoSub?.currency ?? "USD";
    const recurringInterval = dodoSub?.recurring_interval ?? "month";
    const status = statusFromQuery || dodoSub?.status || "active";
    const currentPeriodStart = safeParseDate(dodoSub?.current_period_start) || now;
    const currentPeriodEnd = safeParseDate(dodoSub?.current_period_end) || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const cancelAtPeriodEnd = Boolean(dodoSub?.cancel_at_period_end) || false;
    const canceledAt = safeParseDate(dodoSub?.canceled_at);

    await db
      .insert(subscription)
      .values({
        id: subscriptionId,
        createdAt: now,
        modifiedAt: now,
        amount,
        currency,
        recurringInterval,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canceledAt,
        startedAt: currentPeriodStart,
        endsAt: null,
        endedAt: null,
        customerId: currentUser.email ?? "",
        productId,
        discountId: null,
        checkoutId: subscriptionId,
        customerCancellationReason: null,
        customerCancellationComment: null,
        metadata: null,
        customFieldData: null,
        userId: currentUser.id,
      })
      .onConflictDoUpdate({
        target: subscription.id,
        set: {
          modifiedAt: now,
          amount,
          currency,
          recurringInterval,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          canceledAt,
          productId,
          userId: currentUser.id,
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("sync-from-success error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


