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
import { emailService } from "./email";
import { validateEmailConfiguration } from "./email";
import { nanoid } from "nanoid";

// Custom plugin to handle unverified email login attempts
const emailVerificationPlugin = {
  id: "email-verification-interceptor",
  hooks: {
    before: [
      {
        matcher: (context: any) => {
          return context.path === "/sign-in/email";
        },
        handler: async (context: any) => {
          try {
            const body = context.body;
            const email = body?.email;

            if (!email) {
              return;
            }

            // Check if user exists and is unverified
            const users = await db
              .select()
              .from(user)
              .where(eq(user.email, email))
              .limit(1);

            const foundUser = users[0];

            // If user exists but email is not verified, send verification email
            if (foundUser && !foundUser.emailVerified) {
              console.log(`📧 User ${email} attempting login with unverified email. Sending verification email...`);
              
              // Check rate limit before sending
              const canSend = await emailService.checkRateLimit(email, 'verification');
              
              if (canSend) {
                // Generate verification token
                const token = nanoid(32);
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                // Invalidate previous tokens
                await db
                  .delete(verification)
                  .where(eq(verification.identifier, `email-verification:${foundUser.id}`));

                // Store new token
                await db.insert(verification).values({
                  id: nanoid(),
                  identifier: `email-verification:${foundUser.id}`,
                  value: token,
                  expiresAt,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });

                // Generate verification URL
                const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

                // Send verification email
                await emailService.sendVerificationEmail(email, verificationUrl);
                console.log(`✅ Verification email sent to ${email}`);
              } else {
                console.log(`⚠️ Rate limit reached for ${email}, skipping verification email`);
              }

              // Throw error to prevent login
              throw new Error("Email not verified. A verification email has been sent to your inbox. Please verify your email before signing in.");
            }
          } catch (error) {
            // Re-throw to prevent login
            throw error;
          }
        },
      },
    ],
  },
};

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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Enable email verification
    autoSignIn: false, // Don't auto sign-in after signup
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      // Use default scrypt hashing (BetterAuth default)
      // No need to specify cost for scrypt
    },
    sendResetPassword: async ({ user, url }: { user: { email: string; id: string }; url: string }) => {
      try {
        console.log(`📧 Sending password reset email to: ${user.email}`);
        await emailService.sendPasswordResetEmail(user.email, url);
        console.log(`✅ Password reset email sent successfully to: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send password reset email to ${user.email}:`, error);
        throw error;
      }
    },
  },
  rateLimit: {
    window: 60, // 1 minute window
    max: 10, // Max 10 requests per minute per IP
    storage: "memory", // Use memory storage for rate limiting
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },
  user: {
    additionalFields: {
      // Track failed login attempts for account lockout
      failedLoginAttempts: {
        type: "number",
        defaultValue: 0,
      },
      lockedUntil: {
        type: "date",
        required: false,
      },
      lastLoginAttempt: {
        type: "date",
        required: false,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    emailVerificationPlugin as any,
    dodopayments({
      client: dodoPayments,
      createCustomerOnSignUp: false, // Disable automatic customer creation to avoid blocking sign-up
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

// Validate email configuration on startup
export const validateAuthConfiguration = (): void => {
  try {
    // Validate email service configuration first
    validateEmailConfiguration();
    
    // Validate auth-specific environment variables
    const requiredEnvVars = [
      'BETTER_AUTH_SECRET',
      'NEXT_PUBLIC_APP_URL',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables for authentication:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate BETTER_AUTH_SECRET strength
    const secret = process.env.BETTER_AUTH_SECRET;
    if (secret && secret.length < 32) {
      console.warn('⚠️ BETTER_AUTH_SECRET should be at least 32 characters long for security');
    }

    // Validate APP_URL format
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && !appUrl.startsWith('http')) {
      console.warn('⚠️ NEXT_PUBLIC_APP_URL should start with http:// or https://');
    }

    console.log('✅ Authentication configuration validated successfully');
    console.log(`🔐 Auth configured for domain: ${appUrl}`);
    console.log('🔒 Email/password authentication: enabled');
    console.log('🔒 Email verification: required');
    console.log('🔒 Account lockout: enabled (5 attempts, 15 min lockout)');
    console.log('📧 Email rate limiting: enabled (3 per hour per type)');
  } catch (error) {
    console.error('❌ Authentication configuration validation failed:', error);
    throw error;
  }
};
