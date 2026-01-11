import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { customersCache } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/db/customers
 * Fetch customers from local database cache
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

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "200", 10);

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

    // Calculate offset
    const offset = (page - 1) * perPage;

    // Fetch customers from database
    const customers = await db
      .select()
      .from(customersCache)
      .where(eq(customersCache.userId, userId))
      .orderBy(desc(customersCache.updatedAt))
      .limit(perPage + 1) // Fetch one extra to check if there are more pages
      .offset(offset);

    // Check if there are more pages
    const hasMorePage = customers.length > perPage;
    const resultCustomers = hasMorePage ? customers.slice(0, perPage) : customers;

    // Map to response format similar to Zoho contacts
    const mappedCustomers = resultCustomers.map((customer: typeof customersCache.$inferSelect) => {
      const contactPersons = JSON.parse(customer.contactPersons || "[]");
      
      return {
        contact_id: customer.zohoCustomerId,
        contact_name: customer.customerName,
        company_name: customer.companyName || "",
        contact_type: "customer",
        customer_sub_type: "business",
        status: "active",
        email: customer.primaryEmail || "",
        phone: customer.primaryPhone || "",
        mobile: customer.primaryPhone || "",
        contact_persons: contactPersons,
        last_modified_time: customer.zohoLastModifiedAt?.toISOString() || customer.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        code: 0,
        message: "success",
        contacts: mappedCustomers,
        page_context: {
          page,
          per_page: perPage,
          has_more_page: hasMorePage,
          total: resultCustomers.length,
        },
      },
      meta: {
        page,
        perPage,
        organizationId: "local-db",
      },
    });
  } catch (error) {
    console.error("Error fetching customers from database:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
