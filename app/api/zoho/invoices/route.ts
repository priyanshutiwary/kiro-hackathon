import { auth } from "@/lib/auth";
import { createZohoAPIClient } from "@/lib/zoho-api-client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/zoho/invoices
 * Fetches invoices from Zoho Books
 */
export const dynamic = 'force-dynamic';


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

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "50", 10);

    // Validate pagination parameters
    if (page < 1 || perPage < 1 || perPage > 200) {
      return NextResponse.json(
        {
          error: "Invalid pagination parameters",
          details: "Page must be >= 1 and per_page must be between 1 and 200",
        },
        { status: 400 }
      );
    }

    // Create API client and fetch invoices
    const apiClient = createZohoAPIClient();

    try {
      const response = await apiClient.getInvoices(userId, page, perPage);
      console.log("response", response);
      
      return NextResponse.json({
        success: true,
        data: response.invoices,
        pagination: response.pageContext,
      });
    } catch (error) {
      // Handle specific API errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("not found") || errorMessage.includes("connect")) {
        return NextResponse.json(
          {
            error: "Integration not connected",
            details: errorMessage,
          },
          { status: 404 }
        );
      }

      if (errorMessage.includes("Authentication failed") || errorMessage.includes("reconnect")) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            details: errorMessage,
          },
          { status: 401 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
