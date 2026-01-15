/**
 * Quick script to check and update timezone settings
 */

import { db } from "@/db/drizzle";
import { reminderSettings } from "@/db/schema";

async function checkTimezone() {
  console.log("\n=== Checking Timezone Settings ===\n");
  
  try {
    // Fetch all reminder settings
    const settings = await db.select().from(reminderSettings);
    
    console.log(`Found ${settings.length} user(s) with reminder settings:\n`);
    
    settings.forEach((setting, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  User ID: ${setting.userId}`);
      console.log(`  Timezone: ${setting.callTimezone}`);
      console.log(`  Call Window: ${setting.callStartTime} - ${setting.callEndTime}`);
      console.log(`  Call Days: ${setting.callDaysOfWeek}`);
      console.log("");
    });
    
    // Show current time in different timezones
    const now = new Date();
    console.log("Current time comparison:");
    console.log(`  UTC:          ${now.toLocaleString('en-US', { timeZone: 'UTC', hour12: false })}`);
    console.log(`  Asia/Kolkata: ${now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false })}`);
    console.log(`  Server time:  ${now.toLocaleString('en-US', { hour12: false })}`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkTimezone();
