import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { exchangeGoogleCode } from "@/lib/google-oauth";
import { storeGoogleTokens } from "@/lib/google-token-manager";
import { cookies } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
    try {
        const result = await auth.api.getSession({ headers: await headers() });
        if (!result?.session?.userId) {
            return NextResponse.redirect(`${APP_URL}/sign-in`);
        }

        const userId = result.session.userId;
        const { searchParams } = request.nextUrl;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        // Handle user-denied consent
        if (error) {
            return NextResponse.redirect(
                `${APP_URL}/dashboard/integrations?error=google_oauth_denied&details=${encodeURIComponent(error)}`
            );
        }

        if (!code) {
            return NextResponse.redirect(
                `${APP_URL}/dashboard/integrations?error=google_missing_code`
            );
        }

        // Verify CSRF state
        const cookieStore = await cookies();
        const storedState = cookieStore.get("google_oauth_state")?.value;
        cookieStore.delete("google_oauth_state");

        if (!storedState || storedState !== state) {
            return NextResponse.redirect(
                `${APP_URL}/dashboard/integrations?error=google_invalid_state`
            );
        }

        // Exchange code for tokens
        const tokens = await exchangeGoogleCode(code);

        // Store tokens in DB (encrypted)
        await storeGoogleTokens(userId, tokens);

        // Redirect to integrations page — user will then set their spreadsheet URL
        return NextResponse.redirect(
            `${APP_URL}/dashboard/integrations?success=google_sheets_connected`
        );
    } catch (error) {
        console.error("[Google Sheets] OAuth callback error:", error);
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.redirect(
            `${APP_URL}/dashboard/integrations?error=google_callback_failed&details=${encodeURIComponent(errorMsg)}`
        );
    }
}
