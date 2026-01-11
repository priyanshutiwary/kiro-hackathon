/**
 * Check and Refresh Zoho Token
 * 
 * This script checks the Zoho token status and refreshes it if needed.
 * 
 * Usage: npx tsx scripts/check-zoho-token.ts <userId>
 */

import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createZohoOAuthService } from "@/lib/zoho-oauth";
import { createZohoTokenManager } from "@/lib/zoho-token-manager";

async function main() {
  const userId = process.argv[2];

  if (!userId) {
    console.error("Usage: npx tsx scripts/check-zoho-token.ts <userId>");
    process.exit(1);
  }

  console.log("=".repeat(80));
  console.log("ZOHO TOKEN STATUS CHECK");
  console.log("=".repeat(80));
  console.log(`User ID: ${userId}`);
  console.log();

  // Get integration
  const integrations = await db
    .select()
    .from(agentIntegrations)
    .where(
      and(
        eq(agentIntegrations.userId, userId),
        eq(agentIntegrations.provider, "zoho_books")
      )
    )
    .limit(1);

  if (integrations.length === 0) {
    console.error("❌ No Zoho Books integration found");
    process.exit(1);
  }

  const integration = integrations[0];
  console.log("Integration Status:");
  console.log(`  Status: ${integration.status}`);
  console.log(`  Enabled: ${integration.enabled}`);
  console.log(`  Last Sync: ${integration.lastSyncAt?.toISOString() || "Never"}`);
  console.log();

  // Check token expiration
  const now = new Date();
  const expiresAt = integration.accessTokenExpiresAt;

  console.log("Token Status:");
  console.log(`  Current Time: ${now.toISOString()}`);
  console.log(`  Expires At: ${expiresAt?.toISOString() || "Unknown"}`);

  if (expiresAt) {
    const isExpired = now >= expiresAt;
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    const minutesUntilExpiry = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

    if (isExpired) {
      console.log(`  Status: ❌ EXPIRED (${Math.abs(hoursUntilExpiry)} hours ago)`);
    } else {
      console.log(`  Status: ✅ Valid (expires in ${hoursUntilExpiry}h ${minutesUntilExpiry}m)`);
    }

    // Refresh if expired or expiring soon (within 1 hour)
    if (isExpired || timeUntilExpiry < 3600000) {
      console.log();
      console.log("🔄 Token expired or expiring soon, attempting refresh...");

      try {
        const oauthService = createZohoOAuthService();
        const tokenManager = createZohoTokenManager();

        // Parse config
        const config = JSON.parse(integration.config || "{}");

        // Refresh token
        const newTokens = await oauthService.refreshAccessToken(
          integration.refreshToken || "",
          config.accountsServer || "https://accounts.zoho.com"
        );

        // Update tokens
        await tokenManager.updateTokens(userId, newTokens);

        console.log("✅ Token refreshed successfully!");
        console.log(`   New expiry: ${newTokens.expiresAt.toISOString()}`);
      } catch (error) {
        console.error("❌ Failed to refresh token:", error);
        console.error();
        console.error("Please reconnect your Zoho Books account:");
        console.error("  1. Go to Integrations page");
        console.error("  2. Disconnect Zoho Books");
        console.error("  3. Reconnect Zoho Books");
        process.exit(1);
      }
    }
  } else {
    console.log(`  Status: ⚠️  Unknown (no expiry date)`);
  }

  console.log();
  console.log("=".repeat(80));

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
