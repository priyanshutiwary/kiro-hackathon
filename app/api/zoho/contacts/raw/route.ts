import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createZohoContactsClient } from "@/lib/payment-reminders/zoho-contacts-client";
import { headers } from "next/headers";

/**
 * Test endpoint to fetch raw contact data directly from Zoho API
 * This helps debug what data is actually available in Zoho Books
 */
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

    const zohoClient = createZohoContactsClient();

    // Fetch contacts directly from Zoho API
    const response = await zohoClient.getContacts(userId, page, perPage);

    console.log("[Raw Zoho API] Full response:", JSON.stringify(response, null, 2));

    return NextResponse.json({
      success: true,
      data: response,
      note: "This is raw data directly from Zoho Books API",
    });
  } catch (error) {
    console.error("[Raw Zoho API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch contacts from Zoho",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
