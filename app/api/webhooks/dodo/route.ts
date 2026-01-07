import { db } from "@/db/drizzle";
import { subscription, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";

const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_SECRET || "");

// Utility function to safely parse dates
function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    return new Date(value);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const rawBody = await request.text();

    // Verify webhook signature
    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };

    try {
      await webhook.verify(rawBody, webhookHeaders);
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const { event_type, data } = payload;

    console.log("🎯 Received Dodo webhook:", event_type);
    console.log("📦 Payload:", JSON.stringify(data, null, 2));

    // Handle subscription events
    if (
      event_type === "subscription.created" ||
      event_type === "subscription.updated" ||
      event_type === "subscription.activated" ||
      event_type === "subscription.canceled" ||
      event_type === "subscription.expired" ||
      event_type === "payment.succeeded"
    ) {
      await handleSubscriptionEvent(data, event_type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

interface DodoWebhookData {
  payment_id: string;
  customer?: {
    email: string;
    customer_id: string;
  };
  product?: {
    product_id: string;
    price: number;
    currency: string;
  };
  subscription?: {
    subscription_id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    canceled_at?: string;
    recurring_interval: string;
  };
  amount: number;
  currency: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

async function handleSubscriptionEvent(data: DodoWebhookData, eventType: string) {
  try {
    // Find user by email
    const customerEmail = data.customer?.email;
    if (!customerEmail) {
      console.error("No customer email in webhook payload");
      return;
    }

    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, customerEmail))
      .limit(1);

    const foundUser = users[0];
    if (!foundUser) {
      console.error(`No user found with email: ${customerEmail}`);
      return;
    }

    console.log(`Found user: ${foundUser.id} for email: ${customerEmail}`);

    // Extract subscription data
    const subscriptionData = data.subscription;
    if (!subscriptionData && data.payment_id) {
      // For one-time payments, we might need to handle differently
      console.log("One-time payment, skipping subscription creation");
      return;
    }

    // Map Dodo status to our internal status
    let status = subscriptionData?.status || "active";
    if (eventType === "subscription.canceled") {
      status = "canceled";
    } else if (eventType === "subscription.expired") {
      status = "expired";
    }

    // Prepare subscription data for database
    const subscriptionRecord = {
      id: subscriptionData?.subscription_id || data.payment_id,
      createdAt: safeParseDate(data.created_at) || new Date(),
      modifiedAt: new Date(),
      amount: data.amount || data.product?.price || 0,
      currency: data.currency || data.product?.currency || "USD",
      recurringInterval: subscriptionData?.recurring_interval || "month",
      status: status,
      currentPeriodStart: safeParseDate(subscriptionData?.current_period_start) || new Date(),
      currentPeriodEnd: safeParseDate(subscriptionData?.current_period_end) || new Date(),
      cancelAtPeriodEnd: subscriptionData?.cancel_at_period_end || false,
      canceledAt: safeParseDate(subscriptionData?.canceled_at),
      startedAt: safeParseDate(subscriptionData?.current_period_start) || new Date(),
      endsAt: safeParseDate(subscriptionData?.current_period_end),
      endedAt: status === "canceled" || status === "expired" ? new Date() : null,
      customerId: data.customer?.customer_id || "",
      productId: data.product?.product_id || "",
      discountId: null,
      checkoutId: data.payment_id || "",
      customerCancellationReason: null,
      customerCancellationComment: null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      customFieldData: null,
      userId: foundUser.id,
    };

    console.log("💾 Upserting subscription:", {
      id: subscriptionRecord.id,
      status: subscriptionRecord.status,
      userId: subscriptionRecord.userId,
      amount: subscriptionRecord.amount,
    });

    // Upsert subscription
    await db
      .insert(subscription)
      .values(subscriptionRecord)
      .onConflictDoUpdate({
        target: subscription.id,
        set: {
          modifiedAt: subscriptionRecord.modifiedAt,
          amount: subscriptionRecord.amount,
          currency: subscriptionRecord.currency,
          recurringInterval: subscriptionRecord.recurringInterval,
          status: subscriptionRecord.status,
          currentPeriodStart: subscriptionRecord.currentPeriodStart,
          currentPeriodEnd: subscriptionRecord.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionRecord.cancelAtPeriodEnd,
          canceledAt: subscriptionRecord.canceledAt,
          startedAt: subscriptionRecord.startedAt,
          endsAt: subscriptionRecord.endsAt,
          endedAt: subscriptionRecord.endedAt,
          customerId: subscriptionRecord.customerId,
          productId: subscriptionRecord.productId,
          metadata: subscriptionRecord.metadata,
          userId: subscriptionRecord.userId,
        },
      });

    console.log("✅ Successfully processed subscription webhook");
  } catch (error) {
    console.error("💥 Error handling subscription event:", error);
    throw error;
  }
}

