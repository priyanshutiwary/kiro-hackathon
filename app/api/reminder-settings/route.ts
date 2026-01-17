import { getUserSettings, updateUserSettings, ReminderSettings } from "@/lib/payment-reminders/settings-manager";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { checkAuthAndVerification } from "@/lib/auth-utils";

/**
 * GET /api/reminder-settings
 * Fetches user's current reminder settings
 * Requirements: 11.1, 11.2, 2.6, 4.4
 */
export async function GET() {
  try {
    // Authenticate user and check email verification
    const authCheck = await checkAuthAndVerification(await headers());
    
    if (!authCheck.authenticated) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 });
    }
    
    if (!authCheck.emailVerified) {
      return NextResponse.json({ 
        error: authCheck.error,
        code: authCheck.errorCode
      }, { status: 403 });
    }

    const userId = authCheck.userId!;

    // Get user settings
    const settings = await getUserSettings(userId);

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching reminder settings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reminder settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reminder-settings
 * Updates user's reminder settings
 * Requirements: 11.3, 11.5, 19.9, 2.6, 4.4
 */
export async function PUT(request: Request) {
  try {
    // Authenticate user and check email verification
    const authCheck = await checkAuthAndVerification(await headers());
    
    if (!authCheck.authenticated) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 });
    }
    
    if (!authCheck.emailVerified) {
      return NextResponse.json({ 
        error: authCheck.error,
        code: authCheck.errorCode
      }, { status: 403 });
    }

    const userId = authCheck.userId!;

    // Parse request body
    const updates: Partial<ReminderSettings> = await request.json();

    // Update user settings (includes validation)
    const updateResult = await updateUserSettings(userId, updates);

    if (!updateResult.success) {
      return NextResponse.json(
        {
          error: "Invalid settings",
          details: updateResult.errors,
        },
        { status: 400 }
      );
    }

    // Fetch and return updated settings
    const settings = await getUserSettings(userId);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error updating reminder settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update reminder settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
