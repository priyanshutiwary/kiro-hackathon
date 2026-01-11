/**
 * Helper script to list users in the database
 */

import { db } from "@/db/drizzle";
import { user, agentIntegrations, reminderSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function listUsers() {
  console.log("=== Available Users ===\n");
  
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .limit(10);
  
  if (users.length === 0) {
    console.log("No users found in database");
    process.exit(0);
  }
  
  console.log(`Found ${users.length} user(s):\n`);
  
  for (const u of users) {
    console.log(`User ID: ${u.id}`);
    console.log(`Name: ${u.name}`);
    console.log(`Email: ${u.email}`);
    
    // Check if user has Zoho integration
    const integration = await db
      .select()
      .from(agentIntegrations)
      .where(
        and(
          eq(agentIntegrations.userId, u.id),
          eq(agentIntegrations.provider, "zoho_books")
        )
      )
      .limit(1);
    
    // Check reminder settings for org ID
    const settings = await db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.userId, u.id))
      .limit(1);
    
    if (integration.length > 0) {
      const orgId = settings.length > 0 ? settings[0].organizationId : null;
      console.log(`Zoho Integration: ✅ Connected`);
      if (orgId) {
        console.log(`Organization ID: ${orgId}`);
      } else {
        console.log(`Organization ID: ⚠ Not set in reminder settings`);
      }
    } else {
      console.log(`Zoho Integration: ❌ Not connected`);
    }
    
    console.log();
  }
  
  console.log("\nTo run verification, use:");
  console.log("TEST_USER_ID=<user_id> ZOHO_ORG_ID=<org_id> npx tsx scripts/verify-invoice-customer-refs.ts");
  
  process.exit(0);
}

listUsers().catch((error) => {
  console.error("Failed to list users:", error);
  process.exit(1);
});
