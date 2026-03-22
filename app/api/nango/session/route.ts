import { auth } from "@/lib/auth";
import { getNangoClient } from "@/lib/nango/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/nango/session
 * 
 * Generates a Nango connect session token for the authenticated user.
 * This token is used by the frontend Nango SDK to initiate OAuth flows.
 * 
 * Requirements: FR-7 (Unified OAuth Flow)
 * Task: 7.1 - Create session token endpoint
 */
export async function GET() {
  try {
    // 7.1.1 Authenticate user session
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

    // Get user details from database
    const userRecord = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    const userEmail = userRecord[0]?.email || '';
    const userName = userRecord[0]?.name || '';

    // 7.1.2 Generate Nango connect session token
    const nango = getNangoClient();
    
    // Updated API format: use tags instead of end_user
    const { data } = await nango.createConnectSession({
      tags: {
        end_user_id: userId,
        end_user_email: userEmail,
        end_user_display_name: userName,
      },
      // Optional: restrict which integrations can be connected
      // allowed_integrations: ['quickbooks', 'xero', 'freshbooks']
    });

    // 7.1.3 Return session token to frontend
    return NextResponse.json({
      sessionToken: data.token,
      userId,
    });
  } catch (error) {
    console.error("Error generating Nango session token:", error);
    return NextResponse.json(
      {
        error: "Failed to generate session token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
