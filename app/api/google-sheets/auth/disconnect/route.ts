import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGoogleIntegration, deleteGoogleIntegration } from "@/lib/google-token-manager";
import { revokeGoogleTokens } from "@/lib/google-oauth";

export async function POST() {
    try {
        const result = await auth.api.getSession({ headers: await headers() });
        if (!result?.session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = result.session.userId;
        const integration = await getGoogleIntegration(userId);

        if (integration?.refreshToken) {
            await revokeGoogleTokens(integration.refreshToken);
        }

        await deleteGoogleIntegration(userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Google Sheets] Disconnect error:", error);
        return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }
}
