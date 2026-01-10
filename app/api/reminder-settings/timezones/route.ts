import { getSupportedTimezones } from "@/lib/payment-reminders/settings-manager";
import { NextResponse } from "next/server";

/**
 * GET /api/reminder-settings/timezones
 * Returns list of supported IANA timezones
 * Requirements: 2.7
 */
export async function GET() {
  try {
    const timezones = getSupportedTimezones();

    return NextResponse.json({
      timezones,
      count: timezones.length,
    });
  } catch (error) {
    console.error("Error fetching timezones:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch timezones",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
