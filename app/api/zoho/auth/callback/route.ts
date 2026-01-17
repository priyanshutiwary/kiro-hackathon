import { auth } from "@/lib/auth";
import { createZohoOAuthService } from "@/lib/zoho-oauth";
import { createZohoTokenManager } from "@/lib/zoho-token-manager";
import { syncInvoicesForUser } from "@/lib/payment-reminders/sync-engine";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/zoho/auth/callback
 * Handles OAuth callback from Zoho
 * Requirements: 1.3, 1.4, 1.5
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(
        new URL("/sign-in?error=unauthorized", request.url)
      );
    }

    const userId = result.session.userId;
    const searchParams = request.nextUrl.searchParams;

    // Extract OAuth callback parameters
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const location = searchParams.get("location"); // Multi-DC parameter
    const accountsServer = searchParams.get("accounts-server"); // Multi-DC parameter
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("OAuth error from Zoho:", error);
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?error=oauth_failed&details=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/integrations?error=missing_code",
          request.url
        )
      );
    }

    // TODO: Verify state parameter for CSRF protection
    // In production, compare with stored state from session

    // Determine accounts server URL for Multi-DC support
    let accountsUrl = "https://accounts.zoho.com"; // Default
    if (accountsServer) {
      accountsUrl = accountsServer;
    } else if (location) {
      // Map location to accounts server
      const locationMap: Record<string, string> = {
        us: "https://accounts.zoho.com",
        eu: "https://accounts.zoho.eu",
        in: "https://accounts.zoho.in",
        au: "https://accounts.zoho.com.au",
        jp: "https://accounts.zoho.jp",
        ca: "https://accounts.zoho.com.ca",
      };
      accountsUrl = locationMap[location.toLowerCase()] || accountsUrl;
    }

    // Create OAuth service and token manager
    const oauthService = createZohoOAuthService();
    const tokenManager = createZohoTokenManager();

    // Exchange authorization code for tokens
    const tokens = await oauthService.exchangeCodeForTokens(code, accountsUrl);

    // Fetch organization ID from Zoho API
    let organizationId: string;
    try {
      organizationId = await fetchOrganizationId(
        tokens.accessToken,
        tokens.apiDomain
      );
    } catch (error) {
      console.error("Failed to fetch organization ID:", error);
      // If we can't fetch the org ID, redirect with error
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?error=org_fetch_failed&details=${encodeURIComponent(
            "Failed to fetch organization details. Please try again."
          )}`,
          request.url
        )
      );
    }

    // Store tokens in database
    await tokenManager.storeTokens(
      userId,
      tokens,
      organizationId,
      accountsUrl
    );

    // Trigger initial sync in the background (don't wait for it)
    console.log(`[Zoho OAuth] Triggering initial sync for user ${userId}...`);
    syncInvoicesForUser(userId, organizationId)
      .then((syncResult) => {
        console.log(`[Zoho OAuth] Initial sync completed for user ${userId}:`, {
          fetched: syncResult.invoicesFetched,
          inserted: syncResult.invoicesInserted,
          updated: syncResult.invoicesUpdated,
          reminders: syncResult.remindersCreated,
        });
      })
      .catch((error) => {
        console.error(`[Zoho OAuth] Initial sync failed for user ${userId}:`, error);
      });

    // Redirect to integrations page with success message
    return NextResponse.redirect(
      new URL(
        "/dashboard/integrations?success=zoho_connected",
        request.url
      )
    );
  } catch (error) {
    console.error("Error handling Zoho OAuth callback:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations?error=callback_failed&details=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        request.url
      )
    );
  }
}

/**
 * Fetch organization ID from Zoho Books API with retry logic
 * @param accessToken - Access token
 * @param apiDomain - API domain for the user's data center
 * @param retryCount - Current retry attempt (default: 0)
 * @returns Organization ID
 */
async function fetchOrganizationId(
  accessToken: string,
  apiDomain: string,
  retryCount: number = 0
): Promise<string> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  try {
    const response = await fetch(`${apiDomain}/books/v3/organizations`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      // If 401 and we haven't exhausted retries, wait and retry
      if (response.status === 401 && retryCount < MAX_RETRIES) {
        console.log(`Organization fetch failed with 401. Retrying in ${RETRY_DELAY}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchOrganizationId(accessToken, apiDomain, retryCount + 1);
      }

      throw new Error(
        `Failed to fetch organizations: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Get the first organization (most users have only one)
    if (data.organizations && data.organizations.length > 0) {
      return data.organizations[0].organization_id;
    }

    throw new Error("No organizations found for this Zoho account");
  } catch (error) {
    console.error("Error fetching organization ID:", error);
    throw error; // Re-throw to be handled by the caller
  }
}
