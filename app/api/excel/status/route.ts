import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
    try {
        const result = await auth.api.getSession({ headers: await headers() });
        if (!result?.session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rows = await db
            .select()
            .from(agentIntegrations)
            .where(
                and(
                    eq(agentIntegrations.userId, result.session.userId),
                    eq(agentIntegrations.provider, "excel_upload")
                )
            )
            .limit(1);

        if (!rows.length || !rows[0].enabled) {
            return NextResponse.json({ connected: false });
        }

        const config = rows[0].config ? JSON.parse(rows[0].config) : {};

        return NextResponse.json({
            connected: rows[0].status === "active",
            status: rows[0].status,
            lastUploadedAt: config.lastUploadedAt,
            rowCount: config.rowCount,
            fileName: config.fileName,
        });
    } catch (error) {
        console.error("[Excel] Status error:", error);
        return NextResponse.json({ connected: false, status: "error" }, { status: 500 });
    }
}
