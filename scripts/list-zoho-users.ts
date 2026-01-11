/**
 * List Users with Zoho Integration
 * 
 * This script lists all users who have Zoho Books integration connected.
 * Use this to find a user ID for testing customer sync.
 * 
 * Usage: npx tsx scripts/list-zoho-users.ts
 */

import { db } from "@/db/drizzle";
import { agentIntegrations, user } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=".repeat(80));
  console.log("USERS WITH ZOHO BOOKS INTEGRATION");
  console.log("=".repeat(80));
  console.log();

  // Get all Zoho Books integrations
  const integrations = await db
    .select({
      userId: agentIntegrations.userId,
      status: agentIntegrations.status,
      enabled: agentIntegrations.enabled,
      lastSyncAt: agentIntegrations.lastSyncAt,
      createdAt: agentIntegrations.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(agentIntegrations)
    .leftJoin(user, eq(agentIntegrations.userId, user.id))
    .where(eq(agentIntegrations.provider, "zoho_books"));

  if (integrations.length === 0) {
    console.log("❌ No users with Zoho Books integration found");
    console.log();
    console.log("Please connect a Zoho Books account first:");
    console.log("  1. Sign in to the application");
    console.log("  2. Go to Integrations page");
    console.log("  3. Connect Zoho Books");
    console.log();
    process.exit(0);
  }

  console.log(`Found ${integrations.length} user(s) with Zoho Books integration:\n`);

  integrations.forEach((integration, index) => {
    console.log(`${index + 1}. User: ${integration.userName || "Unknown"}`);
    console.log(`   Email: ${integration.userEmail || "Unknown"}`);
    console.log(`   User ID: ${integration.userId}`);
    console.log(`   Status: ${integration.status}`);
    console.log(`   Enabled: ${integration.enabled}`);
    console.log(`   Last Sync: ${integration.lastSyncAt?.toISOString() || "Never"}`);
    console.log(`   Connected: ${integration.createdAt?.toISOString() || "Unknown"}`);
    console.log();
  });

  console.log("=".repeat(80));
  console.log("To test customer sync, use one of the User IDs above:");
  console.log();
  console.log("  npx tsx scripts/test-customer-sync.ts <USER_ID>");
  console.log();
  console.log("=".repeat(80));

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
