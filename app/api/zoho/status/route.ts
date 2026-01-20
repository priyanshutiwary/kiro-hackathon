import { auth } from "@/lib/auth";
import { createZohoTokenManager } from "@/lib/zoho-token-manager";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/zoho/status
 * Checks Zoho Books integration status
 * Requirements: 5.1, 5.2, 5.3
 */
export const dynamic = 'force-dynamic';


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

    // Create token manager
    const tokenManager = createZohoTokenManager();

    // Get integration status
    const status = await tokenManager.getIntegrationStatus(userId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching Zoho integration status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch integration status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
