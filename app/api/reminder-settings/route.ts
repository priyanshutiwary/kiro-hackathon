import { getUserSettings, updateUserSettings, ReminderSettings } from "@/lib/payment-reminders/settings-manager";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { checkAuthAndVerification } from "@/lib/auth-utils";
import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Helper function to get organization ID from agent integrations
 */
async function getOrganizationIdFromIntegration(userId: string): Promise<string | null> {
  try {
    const integrations = await db
      .select({
        config: agentIntegrations.config,
      })
      .from(agentIntegrations)
      .where(
        and(
          eq(agentIntegrations.userId, userId),
          eq(agentIntegrations.provider, 'zoho_books'),
          eq(agentIntegrations.enabled, true),
          eq(agentIntegrations.status, 'active')
        )
      )
      .limit(1);

    if (integrations.length === 0 || !integrations[0].config) {
      return null;
    }

    const config = JSON.parse(integrations[0].config);
    return config.organizationId || config.organization_id || null;
  } catch (error) {
    console.error('Error fetching organization ID from integration:', error);
    return null;
  }
}

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

    // If organizationId is missing, try to populate it from agentIntegrations
    if (!settings.organizationId) {
      const orgId = await getOrganizationIdFromIntegration(userId);
      if (orgId) {
        // Update settings with organizationId
        await updateUserSettings(userId, { organizationId: orgId });
        settings.organizationId = orgId;
      }
    }

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

    // If organizationId is not provided in updates, try to get it from agentIntegrations
    if (!updates.organizationId) {
      const orgId = await getOrganizationIdFromIntegration(userId);
      if (orgId) {
        updates.organizationId = orgId;
      }
    }

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
