/**
 * Helper script to get organization ID from agent integration config
 */

import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function getOrgId() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error("Usage: npx tsx scripts/get-org-id.ts <user_id>");
    process.exit(1);
  }
  
  const integration = await db
    .select()
    .from(agentIntegrations)
    .where(
      and(
        eq(agentIntegrations.userId, userId),
        eq(agentIntegrations.provider, "zoho_books")
      )
    )
    .limit(1);
  
  if (integration.length === 0) {
    console.error("No Zoho Books integration found for this user");
    process.exit(1);
  }
  
  const config = integration[0].config ? JSON.parse(integration[0].config) : null;
  
  if (config && config.organizationId) {
    console.log(config.organizationId);
  } else {
    console.error("Organization ID not found in integration config");
    process.exit(1);
  }
}

getOrgId().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
