import { auth } from "@/lib/auth";
import { getNangoClient, getConnectionId } from "@/lib/nango/client";
import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/nango/disconnect
 * 
 * Disconnects a Nango provider integration for the authenticated user.
 * Deletes the connection from Nango and removes it from the database.
 * 
 * Requirements: FR-7 (Unified OAuth Flow)
 * Task: 7.4 - Create disconnect endpoint
 */
export async function POST(request: Request) {
  try {
    // 7.4.2 Authenticate user session
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = result.session.userId;

    // 7.4.1 Accept provider in request body
    const body = await request.json();
    const { provider } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    console.log(`🔌 Disconnecting ${provider} for user ${userId}`);

    // Get the integration from database to find the integrationId
    const integration = await db
      .select()
      .from(agentIntegrations)
      .where(
        and(
          eq(agentIntegrations.userId, userId),
          eq(agentIntegrations.provider, provider)
        )
      )
      .limit(1);

    if (integration.length === 0) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const config = integration[0].config ? JSON.parse(integration[0].config) : {};
    const integrationId = config.providerConfigKey || provider;

    // 7.4.3 Delete connection via Nango SDK
    const nango = getNangoClient();
    const connectionId = getConnectionId(userId, provider);

    try {
      await nango.deleteConnection(integrationId, connectionId);
      console.log(`✅ Deleted Nango connection: ${connectionId}`);
    } catch (error) {
      console.error("⚠️ Error deleting Nango connection:", error);
      // Continue to delete from database even if Nango deletion fails
    }

    // 7.4.4 Delete integration from database
    await db
      .delete(agentIntegrations)
      .where(
        and(
          eq(agentIntegrations.userId, userId),
          eq(agentIntegrations.provider, provider)
        )
      );

    console.log(`✅ Deleted integration from database`);

    // 7.4.5 Return success response
    return NextResponse.json({
      success: true,
      message: `${provider} disconnected successfully`,
    });
  } catch (error) {
    console.error("❌ Error disconnecting provider:", error);
    return NextResponse.json(
      {
        error: "Failed to disconnect provider",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
