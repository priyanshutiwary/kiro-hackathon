import { db } from "@/db/drizzle";
import { user, verification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    console.log(`🔍 Verifying token: ${token}`);

    if (!token) {
      return NextResponse.json(
        { error: { message: "Token is required" } },
        { status: 400 }
      );
    }

    // Find the verification token in the database
    const verificationRecords = await db
      .select()
      .from(verification)
      .where(eq(verification.value, token))
      .limit(1);

    const verificationRecord = verificationRecords[0];

    if (!verificationRecord) {
      console.log(`❌ Token not found: ${token}`);
      return NextResponse.json(
        { error: { message: "Invalid or expired verification token" } },
        { status: 401 }
      );
    }

    console.log(`✅ Token found: ${verificationRecord.identifier}`);

    // Check if token is expired
    if (new Date() > new Date(verificationRecord.expiresAt)) {
      console.log(`❌ Token expired: ${token}`);
      // Delete expired token
      await db
        .delete(verification)
        .where(eq(verification.id, verificationRecord.id));

      return NextResponse.json(
        { error: { message: "Verification token has expired" } },
        { status: 401 }
      );
    }

    // Extract user ID from identifier (format: "email-verification:userId")
    const userId = verificationRecord.identifier.replace("email-verification:", "");

    // Update user's emailVerified status
    await db
      .update(user)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    console.log(`✅ Email verified for user: ${userId}`);

    // Delete the verification token
    await db
      .delete(verification)
      .where(eq(verification.id, verificationRecord.id));

    console.log(`✅ Verification token deleted`);

    return NextResponse.json(
      { success: true, message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: { message: "Failed to verify email" } },
      { status: 500 }
    );
  }
}
