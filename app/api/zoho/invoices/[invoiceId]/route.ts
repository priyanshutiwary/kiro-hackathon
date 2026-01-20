import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createZohoAPIClient } from "@/lib/zoho-api-client";

/**
 * GET /api/zoho/invoices/[invoiceId]
 * Fetch detailed invoice information from Zoho Books
 */
export const dynamic = 'force-dynamic';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized", details: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const userId = result.session.userId;
    const { invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Bad Request", details: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Create API client
    const apiClient = createZohoAPIClient();

    // Get integration to retrieve organization ID
    const tokenManager = apiClient["tokenManager"];
    const integration = await tokenManager.getIntegration(userId);
    
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found", details: "Please connect your Zoho Books account" },
        { status: 404 }
      );
    }

    const organizationId = integration.config.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Configuration error", details: "Organization ID not found" },
        { status: 500 }
      );
    }

    // Fetch detailed invoice data directly from Zoho API
    const endpoint = `/books/v3/invoices/${invoiceId}?organization_id=${organizationId}`;
    const response = await apiClient["makeRequest"]<{ invoice: Record<string, unknown> }>(userId, endpoint);

    return NextResponse.json({
      success: true,
      data: response.invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch invoice details";
    const statusCode = errorMessage.includes("not found") ? 404 : 500;

    return NextResponse.json(
      {
        error: "Failed to fetch invoice details",
        details: errorMessage,
      },
      { status: statusCode }
    );
  }
}
