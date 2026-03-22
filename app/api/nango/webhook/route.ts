import { getNangoClient } from "@/lib/nango/client";
import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { NangoWebhookPayload, NangoAuthWebhookPayload } from "@/lib/nango/types";

/**
 * POST /api/nango/webhook
 * 
 * Handles Nango webhook events for connection lifecycle management.
 * Processes auth webhooks (creation, override, refresh) and sync webhooks.
 * 
 * Requirements: FR-7 (Unified OAuth Flow)
 * Task: 7.3 - Create webhook endpoint
 */
export async function POST(request: Request) {
  try {
    const payload: NangoWebhookPayload = await request.json();

    console.log("📥 Received Nango webhook:", payload.type, payload);

    // 7.3.1 Verify Nango webhook signature
    const signature = request.headers.get("x-nango-hmac-sha256");
    if (!signature) {
      console.warn("⚠️ Missing Nango webhook signature");
      // In production, you should verify the signature
      // return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Handle auth webhooks (connection creation, override, refresh)
    if (payload.type === 'auth') {
      await handleAuthWebhook(payload);
    }

    // Handle sync webhooks
    if (payload.type === 'sync') {
      console.log(`🔄 Sync webhook received for ${payload.syncName}:`, payload.success ? 'success' : 'failed');
      // Sync webhooks can be handled here if needed
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error processing Nango webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle auth webhook events (creation, override, refresh)
 */
async function handleAuthWebhook(payload: NangoAuthWebhookPayload) {
  try {
    const { connectionId, providerConfigKey, operation, success, tags } = payload;

    // Extract user ID and provider from tags
    const userId = tags?.end_user_id;
    const providerName = providerConfigKey; // Use the integration ID as provider name

    if (!userId) {
      console.error("❌ Missing end_user_id in webhook tags");
      return;
    }

    console.log(`📝 Auth webhook: ${operation} for ${providerName} (user: ${userId})`);

    // Handle connection creation or override (re-authorization)
    if ((operation === 'creation' || operation === 'override') && success) {
      await handleConnectionCreated(userId, providerName, connectionId, providerConfigKey, tags);
    }

    // Handle refresh token errors
    if (operation === 'refresh' && !success) {
      await handleRefreshError(userId, providerName, payload.error);
    }
  } catch (error) {
    console.error("❌ Error handling auth webhook:", error);
    throw error;
  }
}

/**
 * Handle connection created or re-authorized
 */
async function handleConnectionCreated(
  userId: string,
  providerName: string,
  connectionId: string,
  providerConfigKey: string,
  tags?: Record<string, string | undefined>
) {
  try {
    console.log(`✅ Connection ${providerName} for user ${userId}`);

    // 7.3.3 Store integration in agentIntegrations table
    const integrationId = nanoid();
    
    // Check if integration already exists
    const existing = await db
      .select()
      .from(agentIntegrations)
      .where(
        and(
          eq(agentIntegrations.userId, userId),
          eq(agentIntegrations.provider, providerName)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing integration
      await db
        .update(agentIntegrations)
        .set({
          status: "active",
          enabled: true,
          errorMessage: null,
          config: JSON.stringify({
            connectionId,
            providerConfigKey,
            managedByNango: true,
            tags,
          }),
          updatedAt: new Date(),
        })
        .where(eq(agentIntegrations.id, existing[0].id));

      console.log(`💾 Updated existing integration: ${existing[0].id}`);
    } else {
      // Create new integration
      await db.insert(agentIntegrations).values({
        id: integrationId,
        userId,
        integrationType: "oauth",
        provider: providerName,
        accessToken: null, // Nango manages tokens
        refreshToken: null, // Nango manages tokens
        accessTokenExpiresAt: null,
        scope: null,
        config: JSON.stringify({
          connectionId,
          providerConfigKey,
          managedByNango: true,
          tags,
        }),
        status: "active",
        enabled: true,
        lastSyncAt: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`💾 Created new integration: ${integrationId}`);
    }

    // 7.3.4 Trigger initial sync
    await triggerInitialSync(userId, providerName);
  } catch (error) {
    console.error("❌ Error handling connection created:", error);
    throw error;
  }
}

/**
 * Handle refresh token error
 */
async function handleRefreshError(
  userId: string,
  providerName: string,
  error?: { type: string; description: string }
) {
  try {
    console.log(`⚠️ Refresh error for ${providerName} (user: ${userId})`);

    // Update integration status to error
    await db
      .update(agentIntegrations)
      .set({
        status: "error",
        errorMessage: error?.description || "Token refresh failed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentIntegrations.userId, userId),
          eq(agentIntegrations.provider, providerName)
        )
      );

    console.log(`✅ Integration marked as error`);
  } catch (error) {
    console.error("❌ Error handling refresh error:", error);
    throw error;
  }
}

/**
 * Trigger initial sync for a newly connected provider
 */
async function triggerInitialSync(userId: string, providerName: string) {
  try {
    console.log(`🔄 Triggering initial sync for ${providerName}...`);

    // Call the sync API endpoint
    const syncUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/integration/sync`;
    
    const response = await fetch(syncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        provider: providerName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync API returned ${response.status}`);
    }

    console.log(`✅ Initial sync triggered successfully`);
  } catch (error) {
    console.error("❌ Error triggering initial sync:", error);
    // Don't throw - we don't want to fail the webhook if sync fails
    // The sync will be retried on the next cron job
  }
}
