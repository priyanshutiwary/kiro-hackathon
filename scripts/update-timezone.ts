/**
 * Script to update timezone to Asia/Kolkata
 */

import { db } from "@/db/drizzle";
import { reminderSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function updateTimezone() {
  console.log("\n=== Updating Timezone to Asia/Kolkata ===\n");
  
  try {
    const userId = "O213xt9qpN7jYNqSn2iXkUh1Qpg2vNo3";
    
    // Update timezone
    await db
      .update(reminderSettings)
      .set({
        callTimezone: "Asia/Kolkata",
        updatedAt: new Date(),
      })
      .where(eq(reminderSettings.userId, userId));
    
    console.log("✓ Timezone updated successfully!");
    
    // Verify the update
    const updated = await db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.userId, userId));
    
    console.log("\nUpdated settings:");
    console.log(`  Timezone: ${updated[0].callTimezone}`);
    console.log(`  Call Window: ${updated[0].callStartTime} - ${updated[0].callEndTime}`);
    
    // Show current time
    const now = new Date();
    console.log("\nCurrent time:");
    console.log(`  Asia/Kolkata: ${now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false })}`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

updateTimezone();
