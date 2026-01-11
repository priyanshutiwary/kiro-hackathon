import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { invoicesCache, customersCache } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/db/invoices
 * Fetch invoices from local database cache
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

    // Calculate offset
    const offset = (page - 1) * perPage;

    // Fetch invoices from database with customer info
    const invoices = await db
      .select({
        id: invoicesCache.id,
        zohoInvoiceId: invoicesCache.zohoInvoiceId,
        customerId: invoicesCache.customerId,
        invoiceNumber: invoicesCache.invoiceNumber,
        amountTotal: invoicesCache.amountTotal,
        amountDue: invoicesCache.amountDue,
        dueDate: invoicesCache.dueDate,
        status: invoicesCache.status,
        zohoLastModifiedAt: invoicesCache.zohoLastModifiedAt,
        customerName: customersCache.customerName,
        companyName: customersCache.companyName,
      })
      .from(invoicesCache)
      .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
      .where(eq(invoicesCache.userId, userId))
      .orderBy(desc(invoicesCache.dueDate))
      .limit(perPage + 1) // Fetch one extra to check if there are more pages
      .offset(offset);

    // Check if there are more pages
    const hasMorePage = invoices.length > perPage;
    const resultInvoices = hasMorePage ? invoices.slice(0, perPage) : invoices;

    // Map to response format
    const mappedInvoices = resultInvoices.map((invoice: any) => ({
      invoiceId: invoice.zohoInvoiceId,
      customerId: invoice.customerId || "",
      customerName: invoice.customerName || "Unknown Customer",
      companyName: invoice.companyName,
      invoiceNumber: invoice.invoiceNumber || "",
      date: invoice.zohoLastModifiedAt?.toISOString() || "",
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status || "draft",
      total: parseFloat(invoice.amountTotal || "0"),
      balance: parseFloat(invoice.amountDue || "0"),
      currencyCode: "USD", // Default, will be fetched from Zoho on detail view
      currencySymbol: "$", // Default, will be fetched from Zoho on detail view
    }));

    return NextResponse.json({
      success: true,
      data: mappedInvoices,
      pagination: {
        page,
        perPage,
        hasMorePage,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices from database:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
