import { auth } from "@/lib/auth";
import { createZohoAPIClient } from "@/lib/zoho-api-client";
import { createZohoTokenManager } from "@/lib/zoho-token-manager";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/zoho/bills
 * Fetches bills from Zoho Books API
 * Requirements: 3.1, 3.2, 3.3, 3.6, 7.1, 7.2, 7.4
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = result.session.userId;

    // Check if integration exists
    const tokenManager = createZohoTokenManager();
    const hasIntegration = await tokenManager.hasValidIntegration(userId);

    if (!hasIntegration) {
      return NextResponse.json(
        {
          error: "Zoho Books integration not connected",
          message: "Please connect your Zoho Books account first",
          action: "connect",
        },
        { status: 400 }
      );
    }

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "200", 10);

    // Validate pagination parameters
    if (page < 1 || perPage < 1 || perPage > 200) {
      return NextResponse.json(
        {
          error: "Invalid pagination parameters",
          message: "Page must be >= 1 and per_page must be between 1 and 200",
        },
        { status: 400 }
      );
    }

    // Create API client and fetch bills
    const apiClient = createZohoAPIClient();
    const billsResponse = await apiClient.getBills(userId, page, perPage);

    return NextResponse.json(billsResponse);
  } catch (error) {
    console.error("Error fetching bills:", error);

    // Determine error type and provide appropriate response
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Check for specific error types
    if (errorMessage.includes("not found") || errorMessage.includes("not connected")) {
      return NextResponse.json(
        {
          error: "Integration not found",
          message: "Please connect your Zoho Books account",
          action: "connect",
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes("reconnect") || errorMessage.includes("Authentication failed")) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Please reconnect your Zoho Books account",
          action: "reconnect",
        },
        { status: 401 }
      );
    }

    if (errorMessage.includes("Rate limit")) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later",
          action: "retry",
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes("temporarily unavailable") || errorMessage.includes("Service unavailable")) {
      return NextResponse.json(
        {
          error: "Service unavailable",
          message: "Zoho Books service is temporarily unavailable. Please try again later",
          action: "retry",
        },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to fetch bills",
        message: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
