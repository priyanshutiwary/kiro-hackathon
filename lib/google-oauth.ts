/**
 * Google OAuth Service
 * Handles OAuth 2.0 authentication flow for Google Sheets API.
 * Same pattern as zoho-oauth.ts — swap URLs, same param names.
 */

export interface GoogleOAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface GoogleTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: Date;
    scope: string;
    tokenType: string;
}

interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    token_type: string;
    error?: string;
    error_description?: string;
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

// Read-only access to spreadsheets — minimal permission
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

function getConfig(): GoogleOAuthConfig {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "";

    const missing: string[] = [];
    if (!clientId) missing.push("GOOGLE_CLIENT_ID");
    if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
    if (!redirectUri) missing.push("GOOGLE_REDIRECT_URI");

    if (missing.length > 0) {
        throw new Error(
            `Missing required Google OAuth configuration: ${missing.join(", ")}. ` +
            `Please add these to your .env file.`
        );
    }

    return { clientId, clientSecret, redirectUri };
}

/**
 * Build the Google OAuth authorization URL to redirect the user to.
 * Identical param names to Zoho — only the base URL differs.
 */
export function getGoogleAuthorizationUrl(state: string): string {
    const config = getConfig();

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: GOOGLE_SCOPE,
        response_type: "code",
        access_type: "offline",   // required to get a refresh token
        prompt: "consent",        // forces consent screen → always returns refresh_token
        state,
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access + refresh tokens.
 * Identical flow to Zoho — same grant_type, same param names.
 */
export async function exchangeGoogleCode(code: string): Promise<GoogleTokens> {
    const config = getConfig();

    const params = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    const data: GoogleTokenResponse = await response.json();

    if (!response.ok || data.error) {
        throw new Error(
            `Failed to exchange Google auth code: ${data.error_description || data.error || response.statusText}`
        );
    }

    return parseGoogleTokenResponse(data);
}

/**
 * Refresh access token using refresh token.
 * Google refresh tokens do NOT expire (unless user revokes access).
 */
export async function refreshGoogleAccessToken(
    refreshToken: string
): Promise<GoogleTokens> {
    const config = getConfig();

    const params = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    const data: GoogleTokenResponse = await response.json();

    if (!response.ok || data.error) {
        throw new Error(
            `Failed to refresh Google access token: ${data.error_description || data.error || response.statusText}`
        );
    }

    // Google refresh response doesn't include a new refresh_token — keep the existing one
    return parseGoogleTokenResponse(data, refreshToken);
}

/**
 * Revoke tokens (disconnect integration).
 */
export async function revokeGoogleTokens(refreshToken: string): Promise<void> {
    try {
        const params = new URLSearchParams({ token: refreshToken });
        await fetch(GOOGLE_REVOKE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });
        // Don't throw — we still delete local tokens even if revocation fails
    } catch (err) {
        console.warn("[GoogleOAuth] Token revocation failed (non-fatal):", err);
    }
}

/**
 * Check if a Google access token is expired (with 5-min buffer).
 */
export function isGoogleTokenExpired(
    expiresAt: Date,
    bufferSeconds = 300
): boolean {
    return Date.now() >= expiresAt.getTime() - bufferSeconds * 1000;
}

function parseGoogleTokenResponse(
    data: GoogleTokenResponse,
    existingRefreshToken?: string
): GoogleTokens {
    const expiresIn = data.expires_in || 3600;
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || existingRefreshToken || "",
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        scope: data.scope || GOOGLE_SCOPE,
        tokenType: data.token_type || "Bearer",
    };
}
