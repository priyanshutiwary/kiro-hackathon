/**
 * Diagnostic script to check Zoho authentication status
 * 
 * This script helps diagnose authentication issues by:
 * 1. Checking if integration exists
 * 2. Verifying token expiration
 * 3. Testing token refresh
 * 4. Making a test API call
 */

import { db } from "@/db/drizzle";
import { integrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createZohoOAuthService } from "@/lib/zoho-oauth";
import { createZohoContactsClient } from "@/lib/payment-reminders/zoho-contacts-client";

async function diagnoseZohoAuth() {
  console.log("=== Zoho Authentication Diagnostic ===\n");

  try {
    // Find all Zoho integrations
    const zohoIntegrations = await db
      .select()
      .from(integrations)
      .where(eq(integrations.provider, "zoho"));

    if (zohoIntegrations.length === 0) {
      console.log("❌ No Zoho integrations found");
      return;
    }

    console.log(`✅ Found ${zohoIntegrations.length} Zoho integration(s)\n`);

    for (const integration of zohoIntegrations) {
      console.log(`\n--- Integration for user: ${integration.userId} ---`);
      console.log(`Status: ${integration.status}`);
      console.log(`Organization ID: ${integration.config.organizationId}`);
      console.log(`API Domain: ${integration.config.apiDomain}`);
      console.log(`Accounts Server: ${integration.config.accountsServer}`);
      
      // Check token expiration
      const now = new Date();
      const expiresAt = new Date(integration.accessTokenExpiresAt);
      const isExpired = now >= expiresAt;
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60);

      console.log(`\nToken Status:`);
      console.log(`  Expires at: ${expiresAt.toISOString()}`);
      console.log(`  Is expired: ${isExpired ? '❌ YES' : '✅ NO'}`);
      if (!isExpired) {
        console.log(`  Time until expiry: ${minutesUntilExpiry} minutes`);
      }

      // Test token refresh if expired
      if (isExpired) {
        console.log(`\n🔄 Attempting token refresh...`);
        try {
          const oauthService = createZohoOAuthService();
          const newTokens = await oauthService.refreshAccessToken(
            integration.refreshToken,
            integration.config.accountsServer
          );
          console.log(`✅ Token refresh successful`);
          console.log(`  New token expires at: ${newTokens.expiresAt.toISOString()}`);
          
          // Update in database
          await db
            .update(integrations)
            .set({
              accessToken: newTokens.accessToken,
              accessTokenExpiresAt: newTokens.expiresAt,
              updatedAt: new Date(),
            })
            .where(eq(integrations.id, integration.id));
          
          console.log(`✅ Token updated in database`);
        } catch (error) {
          console.error(`❌ Token refresh failed:`, error);
          continue;
        }
      }

      // Test API call to contacts endpoint
      console.log(`\n🧪 Testing Contacts API call...`);
      try {
        const contactsClient = createZohoContactsClient();
        const response = await contactsClient.getContacts(integration.userId, 1, 1);
        console.log(`✅ Contacts API call successful`);
        console.log(`  Fetched ${response.contacts.length} contact(s)`);
        console.log(`  Has more pages: ${response.pageContext.hasMorePage}`);
      } catch (error) {
        console.error(`❌ Contacts API call failed:`, error);
        if (error instanceof Error) {
          console.error(`  Error message: ${error.message}`);
        }
      }
    }

    console.log(`\n=== Diagnostic Complete ===`);
  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
    throw error;
  }
}

// Run diagnostic
diagnoseZohoAuth()
  .then(() => {
    console.log("\n✅ Diagnostic completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Diagnostic failed:", error);
    process.exit(1);
  });
