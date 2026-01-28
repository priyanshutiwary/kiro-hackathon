import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // /api/payments/webhooks is a webhook endpoint that should be accessible without authentication
  if (pathname.startsWith("/api/payments/webhooks")) {
    return NextResponse.next();
  }

  // Allow access to authentication-related pages without session
  const authPages = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthPage = authPages.some(page => pathname.startsWith(page));

  // Redirect unauthenticated users to sign-in
  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // For authenticated users accessing dashboard, check email verification
  if (sessionCookie && pathname.startsWith("/dashboard")) {
    try {
      // Get session from BetterAuth API
      const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        const currentUser = sessionData?.user;

        // If user is not email verified, redirect to verify-email page
        if (currentUser && !currentUser.emailVerified) {
          const verifyUrl = new URL("/verify-email", request.url);
          verifyUrl.searchParams.set("email", currentUser.email);
          verifyUrl.searchParams.set("redirect", "true");
          return NextResponse.redirect(verifyUrl);
        }
      }
    } catch (error) {
      console.error("Error checking email verification in middleware:", error);
      // Continue to the route - let the route handle the error
    }
  }

  // Redirect authenticated users away from auth pages (except verify-email)
  if (sessionCookie && isAuthPage && !pathname.startsWith("/verify-email")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/sign-in", 
    "/sign-up", 
    "/forgot-password", 
    "/reset-password",
    "/verify-email"
  ],
};
