import { db } from "@/db/drizzle";
import { session, user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a user has authenticated recently (within the specified time window)
 * This is used for sensitive operations that require recent authentication
 * 
 * Usage example in an API route:
 * ```typescript
 * const session = await auth.api.getSession({ headers: await headers() });
 * const isRecent = await requireRecentAuthentication(session.session.token);
 * if (!isRecent) {
 *   return NextResponse.json({ error: "Recent authentication required" }, { status: 403 });
 * }
 * ```
 * 
 * @param sessionToken - The session token to check
 * @param maxAgeMinutes - Maximum age of authentication in minutes (default: 30)
 * @returns true if the user has authenticated recently, false otherwise
 */
export async function requireRecentAuthentication(
  sessionToken: string,
  maxAgeMinutes: number = 30
): Promise<boolean> {
  try {
    const sessions = await db
      .select()
      .from(session)
      .where(eq(session.token, sessionToken))
      .limit(1);

    const userSession = sessions[0];
    if (!userSession) {
      return false;
    }

    // Check if session is expired
    if (new Date() > new Date(userSession.expiresAt)) {
      return false;
    }

    // Check if last authentication was recent enough
    const lastAuthTime = new Date(userSession.lastAuthenticatedAt);
    const now = new Date();
    const minutesSinceAuth = (now.getTime() - lastAuthTime.getTime()) / (1000 * 60);

    return minutesSinceAuth <= maxAgeMinutes;
  } catch (error) {
    console.error("Error checking recent authentication:", error);
    return false;
  }
}

/**
 * Check if a user's email is verified
 * This is used to restrict access to features that require email verification
 * 
 * Usage example in an API route:
 * ```typescript
 * const session = await auth.api.getSession({ headers: await headers() });
 * const isVerified = await isEmailVerified(session.user.id);
 * if (!isVerified) {
 *   return NextResponse.json({ 
 *     error: "Email verification required",
 *     code: "EMAIL_NOT_VERIFIED"
 *   }, { status: 403 });
 * }
 * ```
 * 
 * @param userId - The user ID to check
 * @returns true if the user's email is verified, false otherwise
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const foundUser = users[0];
    if (!foundUser) {
      return false;
    }

    return foundUser.emailVerified;
  } catch (error) {
    console.error("Error checking email verification:", error);
    return false;
  }
}

/**
 * Result of authentication and verification check
 */
export interface AuthCheckResult {
  authenticated: boolean;
  emailVerified: boolean;
  userId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Comprehensive authentication check that validates both session and email verification
 * This is a convenience function for routes that require both authentication and email verification
 * 
 * Usage example in an API route:
 * ```typescript
 * const authCheck = await checkAuthAndVerification(await headers());
 * if (!authCheck.authenticated) {
 *   return NextResponse.json({ error: authCheck.error }, { status: 401 });
 * }
 * if (!authCheck.emailVerified) {
 *   return NextResponse.json({ 
 *     error: authCheck.error,
 *     code: authCheck.errorCode
 *   }, { status: 403 });
 * }
 * // Proceed with authenticated and verified user
 * const userId = authCheck.userId;
 * ```
 * 
 * @param headers - Request headers from Next.js
 * @param requireVerification - Whether to require email verification (default: true)
 * @returns AuthCheckResult with authentication and verification status
 */
export async function checkAuthAndVerification(
  headers: Headers,
  requireVerification: boolean = true
): Promise<AuthCheckResult> {
  try {
    // Import auth here to avoid circular dependencies
    const { auth } = await import("@/lib/auth");
    
    const result = await auth.api.getSession({ headers });

    if (!result?.session?.userId) {
      return {
        authenticated: false,
        emailVerified: false,
        error: "Unauthorized",
        errorCode: "UNAUTHORIZED",
      };
    }

    const userId = result.session.userId;

    // If email verification is not required, return success
    if (!requireVerification) {
      return {
        authenticated: true,
        emailVerified: true,
        userId,
      };
    }

    // Check email verification
    const verified = await isEmailVerified(userId);

    if (!verified) {
      return {
        authenticated: true,
        emailVerified: false,
        userId,
        error: "Email verification required. Please verify your email to access this feature.",
        errorCode: "EMAIL_NOT_VERIFIED",
      };
    }

    return {
      authenticated: true,
      emailVerified: true,
      userId,
    };
  } catch (error) {
    console.error("Error in auth check:", error);
    return {
      authenticated: false,
      emailVerified: false,
      error: "Authentication check failed",
      errorCode: "AUTH_CHECK_FAILED",
    };
  }
}
