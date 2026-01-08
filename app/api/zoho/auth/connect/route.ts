import { auth } from "@/lib/auth";
import { createZohoOAuthService } from "@/lib/zoho-oauth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/zoho/auth/connect
 * Initiates OAuth flow by redirecting to Zoho authorization page
 * Requirements: 1.1, 1.2
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

    // Generate CSRF state parameter
    const state = crypto.randomBytes(32).toString("hex");

    // Create OAuth service
    const oauthService = createZohoOAuthService();

    // Generate authorization URL
    const authUrl = oauthService.getAuthorizationUrl(state);

    // Store state in session/cookie for verification in callback
    // For now, we'll include it in the redirect and verify in callback
    // In production, consider storing in a secure session store

    // Redirect to Zoho authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Zoho OAuth flow:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate OAuth flow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
