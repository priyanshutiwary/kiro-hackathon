import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGoogleAuthorizationUrl } from "@/lib/google-oauth";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const result = await auth.api.getSession({ headers: await headers() });
        if (!result?.session?.userId) {
            return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
        }

        // Generate CSRF state token
        const state = crypto.randomBytes(16).toString("hex");

        // Store state in a short-lived cookie for verification in callback
        const cookieStore = await cookies();
        cookieStore.set("google_oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 10, // 10 minutes
            sameSite: "lax",
            path: "/",
        });

        const authUrl = getGoogleAuthorizationUrl(state);
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error("[Google Sheets] Connect error:", error);
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.redirect(
            new URL(
                `/dashboard/integrations?error=google_connect_failed&details=${encodeURIComponent(errorMsg)}`,
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            )
        );
    }
}
