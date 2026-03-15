import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGoogleIntegrationStatus } from "@/lib/google-token-manager";

export async function GET() {
    try {
        const result = await auth.api.getSession({ headers: await headers() });
        if (!result?.session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const status = await getGoogleIntegrationStatus(result.session.userId);
        return NextResponse.json(status);
    } catch (error) {
        console.error("[Google Sheets] Status error:", error);
        return NextResponse.json({ connected: false, status: "error" }, { status: 500 });
    }
}
