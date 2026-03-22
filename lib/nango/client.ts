/**
 * Nango Client Initialization Utility
 * 
 * This module provides a centralized way to initialize and access the Nango SDK
 * for both backend and frontend operations.
 */

import { Nango } from '@nangohq/node';

/**
 * Singleton instance of the Nango backend client
 */
let nangoInstance: Nango | null = null;

/**
 * Get or create the Nango backend client instance
 * 
 * @returns Nango client instance
 * @throws Error if NANGO_SECRET_KEY is not configured
 */
export function getNangoClient(): Nango {
  if (!nangoInstance) {
    const secretKey = process.env.NANGO_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error(
        'NANGO_SECRET_KEY is not configured. Please add it to your .env.local file. ' +
        'Get your secret key from https://nango.dev/dashboard (Settings → API Keys)'
      );
    }

    nangoInstance = new Nango({ 
      secretKey,
      // Optional: Configure host if using self-hosted Nango
      // host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
  }

  return nangoInstance;
}

/**
 * Check if Nango is properly configured
 * 
 * @returns true if NANGO_SECRET_KEY is set, false otherwise
 */
export function isNangoConfigured(): boolean {
  return !!process.env.NANGO_SECRET_KEY;
}

/**
 * Generate a connection ID for a user and provider
 * 
 * Connection IDs follow the format: {userId}_{providerName}
 * This ensures each user can have separate connections to different providers
 * 
 * @param userId - The user's ID
 * @param providerName - The provider name (e.g., 'quickbooks', 'xero')
 * @returns Connection ID string
 */
export function getConnectionId(userId: string, providerName: string): string {
  return `${userId}_${providerName}`;
}

/**
 * Parse a connection ID back into userId and providerName
 * 
 * @param connectionId - The connection ID to parse
 * @returns Object with userId and providerName
 */
export function parseConnectionId(connectionId: string): { userId: string; providerName: string } {
  const [userId, ...providerParts] = connectionId.split('_');
  const providerName = providerParts.join('_'); // Handle provider names with underscores
  
  return { userId, providerName };
}

/**
 * Frontend Nango client configuration
 * 
 * Note: The frontend SDK requires a session token, not the secret key.
 * Use the backend API endpoint to generate session tokens.
 * 
 * Example usage in React component:
 * ```typescript
 * import Nango from '@nangohq/frontend';
 * 
 * const sessionToken = await fetch('/api/nango/session').then(r => r.json());
 * const nango = new Nango({ connectSessionToken: sessionToken });
 * ```
 */
export const NANGO_FRONTEND_CONFIG = {
  // Frontend SDK is initialized per-session with a token from the backend
  // See: app/api/nango/session/route.ts for session token generation
};
