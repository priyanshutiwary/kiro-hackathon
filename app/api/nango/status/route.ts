import { auth } from "@/lib/auth";
import { getNangoClient, getConnectionId } from "@/lib/nango/client";
import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/nango/status?provider={provider}
 * 
 * Checks the connection status for a Nango provider integration.
 * Returns connection status from Nango and last sync information from database.
 * 
 * Requirements: FR-7 (Unified OAuth Flow), FR-10 (Integration Status API)
 * Task: 7.5 - Create status endpoint
 */
export async function GET(request: Request) {
  try {
    // 7.5.2 Authenticate user session
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

    // 7.5.1 Accept provider query parameter
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json(
        { error: "Provider query parameter is required" },
        { status: 400 }
      );
    }

    // 7.5.4 Query agentIntegrations table for last sync
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

    // If no integration found in database, check Nango directly
    if (integration.length === 0) {
      return NextResponse.json({
        connected: false,
        status: "available",
        provider,
      });
    }

    const integrationData = integration[0];
    const config = integrationData.config ? JSON.parse(integrationData.config) : {};
    const connectionId = config.connectionId; // UUID from Nango
    const integrationId = config.providerConfigKey || provider;

    // 7.5.3 Query Nango connection status
    const nango = getNangoClient();

    let nangoConnected = false;
    let nangoError: string | undefined;

    try {
      const connection = await nango.getConnection(integrationId, connectionId);
      nangoConnected = connection !== null && connection !== undefined;
    } catch (error) {
      console.error(`⚠️ Error checking Nango connection for ${provider}:`, error);
      nangoError = error instanceof Error ? error.message : "Unknown error";
    }

    // 7.5.5 Return combined status
    return NextResponse.json({
      connected: nangoConnected && integrationData.status === "active",
      status: integrationData.status,
      provider,
      lastSync: integrationData.lastSyncAt?.toISOString() || null,
      errorMessage: integrationData.errorMessage || nangoError || null,
      enabled: integrationData.enabled,
      config: {
        connectionId,
        integrationId,
        managedByNango: config.managedByNango || false,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching provider status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch provider status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
