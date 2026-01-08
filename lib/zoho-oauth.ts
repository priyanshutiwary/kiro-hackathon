/**
 * Zoho OAuth Service
 * Handles OAuth 2.0 authentication flow with Zoho Books API
 * Supports Multi-DC (Data Center) configuration
 */

export interface ZohoOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  accountsUrl?: string; // Multi-DC support, defaults to .com
}

export interface ZohoTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until expiration
  expiresAt: Date;
  scope: string;
  apiDomain: string; // API domain for this user's data center
  tokenType: string;
}

export interface ZohoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  api_domain: string;
  token_type: string;
  scope?: string;
}

/**
 * Zoho OAuth Service for handling authentication flows
 */
export class ZohoOAuthService {
  private config: Required<ZohoOAuthConfig>;

  constructor(config?: Partial<ZohoOAuthConfig>) {
    // Load from environment variables with optional overrides
    this.config = {
      clientId: config?.clientId || process.env.ZOHO_CLIENT_ID || "",
      clientSecret: config?.clientSecret || process.env.ZOHO_CLIENT_SECRET || "",
      redirectUri: config?.redirectUri || process.env.ZOHO_REDIRECT_URI || "",
      scope: config?.scope || process.env.ZOHO_SCOPE || "ZohoBooks.bills.READ",
      accountsUrl: config?.accountsUrl || "https://accounts.zoho.com",
    };

    this.validateConfig();
  }

  /**
   * Validate that all required configuration is present
   */
  private validateConfig(): void {
    const missing: string[] = [];
    
    if (!this.config.clientId) missing.push("ZOHO_CLIENT_ID");
    if (!this.config.clientSecret) missing.push("ZOHO_CLIENT_SECRET");
    if (!this.config.redirectUri) missing.push("ZOHO_REDIRECT_URI");
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required Zoho OAuth configuration: ${missing.join(", ")}. ` +
        `Please add these to your .env file.`
      );
    }
  }

  /**
   * Generate authorization URL for OAuth flow
   * @param state - CSRF protection state parameter
   * @param accountsUrl - Optional accounts server URL for Multi-DC support
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(state: string, accountsUrl?: string): string {
    const baseUrl = accountsUrl || this.config.accountsUrl;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: "code",
      access_type: "offline", // Request refresh token
      state: state,
      prompt: "consent", // Force consent screen to ensure refresh token
    });

    return `${baseUrl}/oauth/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   * @param code - Authorization code from OAuth callback
   * @param accountsUrl - Accounts server URL from callback (Multi-DC)
   * @returns Token information including access token, refresh token, and expiration
   */
  async exchangeCodeForTokens(
    code: string,
    accountsUrl?: string
  ): Promise<ZohoTokens> {
    const baseUrl = accountsUrl || this.config.accountsUrl;
    const tokenUrl = `${baseUrl}/oauth/v2/token`;

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code: code,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to exchange code for tokens: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      const data: ZohoTokenResponse = await response.json();

      return this.parseTokenResponse(data);
    } catch (error) {
      throw new Error(
        `Error exchanging authorization code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token
   * @param accountsUrl - Accounts server URL (Multi-DC)
   * @returns New token information
   */
  async refreshAccessToken(
    refreshToken: string,
    accountsUrl?: string
  ): Promise<ZohoTokens> {
    const baseUrl = accountsUrl || this.config.accountsUrl;
    const tokenUrl = `${baseUrl}/oauth/v2/token`;

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to refresh access token: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      const data: ZohoTokenResponse = await response.json();

      // Refresh token response may not include a new refresh token
      // In that case, we keep the existing one
      return this.parseTokenResponse(data, refreshToken);
    } catch (error) {
      throw new Error(
        `Error refreshing access token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Revoke tokens (disconnect integration)
   * @param refreshToken - The refresh token to revoke
   * @param accountsUrl - Accounts server URL (Multi-DC)
   */
  async revokeTokens(
    refreshToken: string,
    accountsUrl?: string
  ): Promise<void> {
    const baseUrl = accountsUrl || this.config.accountsUrl;
    const revokeUrl = `${baseUrl}/oauth/v2/token/revoke`;

    const params = new URLSearchParams({
      token: refreshToken,
    });

    try {
      const response = await fetch(revokeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Log but don't throw - revocation might fail if token is already invalid
        console.warn(
          `Token revocation returned non-OK status: ${response.status}. ${errorText}`
        );
      }
    } catch (error) {
      // Log but don't throw - we still want to delete local tokens even if revocation fails
      console.warn(
        `Error revoking tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Parse token response from Zoho API
   * @param data - Token response data
   * @param existingRefreshToken - Existing refresh token to use if new one not provided
   * @returns Parsed token information
   */
  private parseTokenResponse(
    data: ZohoTokenResponse,
    existingRefreshToken?: string
  ): ZohoTokens {
    const expiresIn = data.expires_in || 3600; // Default to 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || existingRefreshToken || "",
      expiresIn: expiresIn,
      expiresAt: expiresAt,
      scope: data.scope || this.config.scope,
      apiDomain: data.api_domain || "https://www.zohoapis.com",
      tokenType: data.token_type || "Bearer",
    };
  }

  /**
   * Check if an access token is expired or about to expire
   * @param expiresAt - Token expiration date
   * @param bufferSeconds - Buffer time in seconds before expiration (default: 300 = 5 minutes)
   * @returns True if token is expired or will expire within buffer time
   */
  isTokenExpired(expiresAt: Date, bufferSeconds: number = 300): boolean {
    const now = new Date();
    const expirationWithBuffer = new Date(
      expiresAt.getTime() - bufferSeconds * 1000
    );
    return now >= expirationWithBuffer;
  }
}

/**
 * Create a default instance of ZohoOAuthService
 * Uses environment variables for configuration
 */
export function createZohoOAuthService(
  config?: Partial<ZohoOAuthConfig>
): ZohoOAuthService {
  return new ZohoOAuthService(config);
}
