import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createZohoAPIClient } from "@/lib/zoho-api-client";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const result = await auth.api.getSession({
          headers: await headers(),
        });
    if (!result?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = result?.session?.userId;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "200");

    // Get organization ID from env or query
    const organizationId = process.env.ZOHO_ORGANIZATION_ID || searchParams.get("organization_id");
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    const zohoClient = createZohoAPIClient();

    // Build query parameters
    const queryParams = new URLSearchParams({
      organization_id: organizationId,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    // Fetch contacts from Zoho
    const endpoint = `/books/v3/contacts?${queryParams.toString()}`;
    
    // @ts-expect-error - Accessing private method for direct API call
    const response = await zohoClient.makeRequest(userId, endpoint);

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        page,
        perPage,
        organizationId,
      },
    });
  } catch (error) {
    console.error("[Zoho Contacts API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch contacts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
