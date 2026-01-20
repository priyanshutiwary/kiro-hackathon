import { db } from "@/db/drizzle";
import { user, verification } from "@/db/schema";
import { emailService } from "@/lib/email";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: { message: "Email is required" } },
        { status: 400 }
      );
    }

    // Check if user exists
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    const foundUser = users[0];

    if (!foundUser) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        { success: true, message: "If the email exists, a verification link has been sent." },
        { status: 200 }
      );
    }

    // Check if email is already verified
    if (foundUser.emailVerified) {
      return NextResponse.json(
        { error: { message: "Email is already verified" } },
        { status: 400 }
      );
    }

    // Check rate limit
    const canSend = await emailService.checkRateLimit(email, 'verification');
    if (!canSend) {
      return NextResponse.json(
        { error: { message: "Too many verification emails sent. Please wait an hour before requesting another." } },
        { status: 429 }
      );
    }

    // Invalidate previous verification tokens for this user
    await db
      .delete(verification)
      .where(eq(verification.identifier, `email-verification:${foundUser.id}`));

    // Generate new verification token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await db.insert(verification).values({
      id: nanoid(),
      identifier: `email-verification:${foundUser.id}`,
      value: token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationUrl);

    return NextResponse.json(
      { success: true, message: "Verification email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send verification email error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("rate limit") || error.message.includes("too many")) {
        return NextResponse.json(
          { error: { message: error.message } },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: { message: "Failed to send verification email" } },
      { status: 500 }
    );
  }
}
