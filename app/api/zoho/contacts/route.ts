import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { customersCache } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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

    // Fetch customers from local database cache
    const offset = (page - 1) * perPage;
    const customers = await db
      .select()
      .from(customersCache)
      .where(eq(customersCache.userId, userId))
      .orderBy(desc(customersCache.updatedAt))
      .limit(perPage + 1) // Fetch one extra to check if there are more pages
      .offset(offset);

    console.log("[Zoho Contacts API] Raw customers from DB:", JSON.stringify(customers, null, 2));

    const hasMorePage = customers.length > perPage;
    const contactsToReturn = hasMorePage ? customers.slice(0, perPage) : customers;

    // Transform database records to match Zoho API format
    const contacts = contactsToReturn.map((customer) => ({
      contact_id: customer.zohoCustomerId,
      contact_name: customer.customerName,
      company_name: customer.companyName || "",
      contact_type: "customer",
      customer_sub_type: "business",
      status: "active",
      email: customer.primaryEmail || undefined,
      phone: customer.primaryPhone || undefined,
      mobile: customer.primaryPhone || undefined,
      contact_persons: customer.primaryContactPersonId ? [{
        contact_person_id: customer.primaryContactPersonId,
        first_name: customer.customerName.split(" ")[0] || "",
        last_name: customer.customerName.split(" ").slice(1).join(" ") || "",
        email: customer.primaryEmail || "",
        phone: customer.primaryPhone || undefined,
        mobile: customer.primaryPhone || undefined,
        is_primary_contact: true,
      }] : [],
      last_modified_time: customer.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        code: 0,
        message: "success",
        contacts,
        page_context: {
          page,
          per_page: perPage,
          has_more_page: hasMorePage,
          total: contacts.length,
        },
      },
      meta: {
        page,
        perPage,
        organizationId: process.env.ZOHO_ORGANIZATION_ID || "",
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
