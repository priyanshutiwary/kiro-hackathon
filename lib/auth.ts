import { db } from "@/db/drizzle";
import { account, session, user, verification, subscription } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  dodopayments,
  checkout,
  portal,
  webhooks,
} from "@dodopayments/better-auth";
import DodoPayments from "dodopayments";
import { eq } from "drizzle-orm";

export const dodoPayments = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: process.env.NODE_ENV === "production" ? "live_mode" : "test_mode",
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  trustedOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  allowedDevOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // Cache duration in seconds
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    dodopayments({
      client: dodoPayments,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.NEXT_PUBLIC_STARTER_TIER!,
              slug: "starter",
            },
          ],
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET || "fallback-secret",
          onPayload: async (payload) => {
            console.log("🎯 Received Dodo webhook:", payload.type || payload.event_type);
            console.log("📦 Payload:", JSON.stringify(payload, null, 2));
            console.log("🔑 Webhook Key:", process.env.DODO_PAYMENTS_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing");
            
            // Process subscription events
            if (payload.type === "subscription.active" || payload.type === "subscription.created") {
              await processSubscriptionWebhook(payload);
            }
          },
        }),
      ],
    }),
    nextCookies(),
  ],
});

// Process subscription webhook events
async function processSubscriptionWebhook(payload: {
  type: string;
  data: {
    subscription_id: string;
    customer: { email: string; customer_id: string };
    recurring_pre_tax_amount: number;
    currency: string;
    payment_frequency_interval: string;
    status: string;
    created_at: string;
    previous_billing_date: string;
    next_billing_date: string;
    cancel_at_next_billing_date: boolean;
    cancelled_at?: string;
    product_id: string;
    discount_id?: string;
    metadata?: Record<string, unknown>;
  };
}) {
  try {
    console.log("🔄 Processing subscription webhook...");
    
    const data = payload.data;
    const customerEmail = data.customer?.email;
    
    if (!customerEmail) {
      console.error("❌ No customer email in webhook payload");
      return;
    }

    // Find user by email
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, customerEmail))
      .limit(1);

    const foundUser = users[0];
    if (!foundUser) {
      console.error(`❌ No user found with email: ${customerEmail}`);
      return;
    }

    console.log(`✅ Found user: ${foundUser.id} for email: ${customerEmail}`);

    // Prepare subscription data
    const subscriptionData = {
      id: data.subscription_id,
      createdAt: new Date(data.created_at),
      modifiedAt: new Date(),
      amount: data.recurring_pre_tax_amount || 1000,
      currency: data.currency || "USD",
      recurringInterval: data.payment_frequency_interval?.toLowerCase() || "month",
      status: data.status || "active",
      currentPeriodStart: new Date(data.previous_billing_date || data.created_at),
      currentPeriodEnd: new Date(data.next_billing_date),
      cancelAtPeriodEnd: data.cancel_at_next_billing_date || false,
      canceledAt: data.cancelled_at ? new Date(data.cancelled_at) : null,
      startedAt: new Date(data.created_at),
      endsAt: null,
      endedAt: null,
      customerId: data.customer?.customer_id || "",
      productId: data.product_id || process.env.NEXT_PUBLIC_STARTER_TIER || "",
      discountId: data.discount_id || null,
      checkoutId: `checkout_${Date.now()}`,
      customerCancellationReason: null,
      customerCancellationComment: null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      customFieldData: null,
      userId: foundUser.id,
    };

    console.log("💾 Upserting subscription:", {
      id: subscriptionData.id,
      status: subscriptionData.status,
      userId: subscriptionData.userId,
      amount: subscriptionData.amount,
    });

    // Upsert subscription
    await db
      .insert(subscription)
      .values(subscriptionData)
      .onConflictDoUpdate({
        target: subscription.id,
        set: {
          modifiedAt: subscriptionData.modifiedAt,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
          recurringInterval: subscriptionData.recurringInterval,
          status: subscriptionData.status,
          currentPeriodStart: subscriptionData.currentPeriodStart,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
          canceledAt: subscriptionData.canceledAt,
          startedAt: subscriptionData.startedAt,
          endsAt: subscriptionData.endsAt,
          endedAt: subscriptionData.endedAt,
          customerId: subscriptionData.customerId,
          productId: subscriptionData.productId,
          metadata: subscriptionData.metadata,
          userId: subscriptionData.userId,
        },
      });

    console.log("✅ Successfully processed subscription webhook");
  } catch (error) {
    console.error("💥 Error processing subscription webhook:", error);
  }
}
