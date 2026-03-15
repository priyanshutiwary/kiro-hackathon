import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { saveGoogleSheetConfig, getGoogleIntegration } from "@/lib/google-token-manager";

/**
 * Extract Google Spreadsheet ID from a full Google Sheets URL or bare ID.
 * URL format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
 */
function extractSpreadsheetId(input: string): string | null {
    // Try to extract from URL
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];

    // If already a bare ID (no slashes, reasonable length)
    if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) {
        return input.trim();
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const result = await auth.api.getSession({ headers: await headers() });
        if (!result?.session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = result.session.userId;

        const body = await request.json();
        const { sheetUrl, sheetName } = body as { sheetUrl?: string; sheetName?: string };

        if (!sheetUrl) {
            return NextResponse.json({ error: "sheetUrl is required" }, { status: 400 });
        }

        const spreadsheetId = extractSpreadsheetId(sheetUrl);
        if (!spreadsheetId) {
            return NextResponse.json(
                { error: "Invalid Google Sheets URL. Please paste the full URL from your browser." },
                { status: 400 }
            );
        }

        // Ensure they have an active Google Sheets integration
        const integration = await getGoogleIntegration(userId);
        if (!integration) {
            return NextResponse.json(
                { error: "Google Sheets not connected. Please connect first." },
                { status: 400 }
            );
        }

        await saveGoogleSheetConfig(userId, spreadsheetId, sheetName || "Sheet1");

        return NextResponse.json({
            success: true,
            spreadsheetId,
            sheetName: sheetName || "Sheet1",
        });
    } catch (error) {
        console.error("[Google Sheets] Set sheet error:", error);
        return NextResponse.json({ error: "Failed to save sheet configuration" }, { status: 500 });
    }
}
