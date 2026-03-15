import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { parseExcelFile, getSheetNames } from "@/lib/excel-parser";
import { db } from "@/db/drizzle";
import { agentIntegrations, customersCache, invoicesCache } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
    try {
        const result = await auth.api.getSession({ headers: await headers() });
        if (!result?.session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = result.session.userId;

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const sheetName = formData.get("sheetName") as string | undefined;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel", // .xls
        ];

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            return NextResponse.json(
                { error: "Invalid file type. Please upload an .xlsx or .xls file." },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // If client wants to know sheet names before choosing (preview step)
        const previewOnly = formData.get("previewOnly") === "true";
        if (previewOnly) {
            const sheetNames = getSheetNames(buffer);
            return NextResponse.json({ sheetNames });
        }

        // Parse the file
        const { invoices, customers } = parseExcelFile(buffer, sheetName || undefined);

        if (invoices.length === 0) {
            return NextResponse.json(
                { error: "No invoice rows found. Make sure the first row is a header row." },
                { status: 400 }
            );
        }

        // ── Upsert agentIntegrations row for excel_upload ──────────────────────
        const existingIntegration = await db
            .select({ id: agentIntegrations.id })
            .from(agentIntegrations)
            .where(
                and(
                    eq(agentIntegrations.userId, userId),
                    eq(agentIntegrations.provider, "excel_upload")
                )
            )
            .limit(1);

        const config = JSON.stringify({
            lastUploadedAt: new Date().toISOString(),
            rowCount: invoices.length,
            fileName: file.name,
        });

        if (existingIntegration.length > 0) {
            await db
                .update(agentIntegrations)
                .set({ config, status: "active", enabled: true, lastSyncAt: new Date(), updatedAt: new Date() })
                .where(
                    and(
                        eq(agentIntegrations.userId, userId),
                        eq(agentIntegrations.provider, "excel_upload")
                    )
                );
        } else {
            await db.insert(agentIntegrations).values({
                id: `excel_${userId}_${crypto.randomBytes(8).toString("hex")}`,
                userId,
                integrationType: "file_upload",
                provider: "excel_upload",
                accessToken: null,
                refreshToken: null,
                scope: null,
                config,
                status: "active",
                enabled: true,
                lastSyncAt: new Date(),
                errorMessage: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // ── Upsert customers ───────────────────────────────────────────────────
        for (const customer of customers) {
            const existingCustomer = await db
                .select({ id: customersCache.id })
                .from(customersCache)
                .where(
                    and(
                        eq(customersCache.userId, userId),
                        eq(customersCache.zohoCustomerId, customer.externalId)
                    )
                )
                .limit(1);

            if (existingCustomer.length > 0) {
                await db
                    .update(customersCache)
                    .set({
                        customerName: customer.customerName,
                        companyName: customer.companyName || null,
                        primaryPhone: customer.primaryPhone || null,
                        primaryEmail: customer.primaryEmail || null,
                        contactPersons: JSON.stringify(customer.contactPersons || []),
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(customersCache.userId, userId),
                            eq(customersCache.zohoCustomerId, customer.externalId)
                        )
                    );
            } else {
                await db.insert(customersCache).values({
                    id: crypto.randomUUID(),
                    userId,
                    zohoCustomerId: customer.externalId,
                    customerName: customer.customerName,
                    companyName: customer.companyName || null,
                    primaryPhone: customer.primaryPhone || null,
                    primaryEmail: customer.primaryEmail || null,
                    contactPersons: JSON.stringify(customer.contactPersons || []),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        // ── Upsert invoices ────────────────────────────────────────────────────
        for (const invoice of invoices) {
            // Find customer cache ID from externalCustomerId
            let customercacheId: string | null = null;
            if (invoice.externalCustomerId) {
                const cust = await db
                    .select({ id: customersCache.id })
                    .from(customersCache)
                    .where(
                        and(
                            eq(customersCache.userId, userId),
                            eq(customersCache.zohoCustomerId, invoice.externalCustomerId)
                        )
                    )
                    .limit(1);
                customercacheId = cust[0]?.id || null;
            }

            const existing = await db
                .select({ id: invoicesCache.id })
                .from(invoicesCache)
                .where(
                    and(
                        eq(invoicesCache.userId, userId),
                        eq(invoicesCache.zohoInvoiceId, invoice.externalId)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                await db
                    .update(invoicesCache)
                    .set({
                        customerId: customercacheId,
                        invoiceNumber: invoice.invoiceNumber || null,
                        amountTotal: invoice.amountTotal || null,
                        amountDue: invoice.amountDue || null,
                        currencyCode: invoice.currencyCode,
                        dueDate: invoice.dueDate,
                        status: invoice.status || null,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(invoicesCache.userId, userId),
                            eq(invoicesCache.zohoInvoiceId, invoice.externalId)
                        )
                    );
            } else {
                await db.insert(invoicesCache).values({
                    id: crypto.randomUUID(),
                    userId,
                    zohoInvoiceId: invoice.externalId,
                    customerId: customercacheId,
                    invoiceNumber: invoice.invoiceNumber || null,
                    amountTotal: invoice.amountTotal || null,
                    amountDue: invoice.amountDue || null,
                    currencyCode: invoice.currencyCode,
                    dueDate: invoice.dueDate,
                    status: invoice.status || null,
                    remindersCreated: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        return NextResponse.json({
            success: true,
            invoiceCount: invoices.length,
            customerCount: customers.length,
        });
    } catch (error) {
        console.error("[Excel Import] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to import Excel file" },
            { status: 500 }
        );
    }
}
