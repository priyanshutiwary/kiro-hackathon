import { auth } from "@/lib/auth";
import { createZohoOAuthService } from "@/lib/zoho-oauth";
import { createZohoTokenManager } from "@/lib/zoho-token-manager";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/zoho/auth/disconnect
 * Disconnects Zoho Books integration
 * Requirements: 2.5
 */

export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = result.session.userId;

    // Create services
    const oauthService = createZohoOAuthService();
    const tokenManager = createZohoTokenManager();

    // Get integration to retrieve tokens
    const integration = await tokenManager.getIntegration(userId);

    if (!integration) {
      return NextResponse.json(
        { error: "No integration found" },
        { status: 404 }
      );
    }

    // Revoke tokens with Zoho
    try {
      await oauthService.revokeTokens(
        integration.refreshToken,
        integration.config.accountsServer
      );
    } catch (error) {
      // Log but continue - we still want to delete local tokens
      console.warn("Failed to revoke tokens with Zoho:", error);
    }

    // Delete integration from database
    await tokenManager.deleteIntegration(userId);

    return NextResponse.json({
      success: true,
      message: "Zoho Books integration disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Zoho integration:", error);
    return NextResponse.json(
      {
        error: "Failed to disconnect integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
