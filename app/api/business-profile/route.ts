import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { businessProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/business-profile
 * Fetch business profile for the authenticated user
 */
export async function GET() {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = result.session.userId;

    // Fetch business profile
    const profiles = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1);

    if (profiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No business profile found",
      });
    }

    const profile = profiles[0];

    // Parse JSON fields
    const businessHours = profile.businessHours 
      ? JSON.parse(profile.businessHours) 
      : null;
    const preferredPaymentMethods = JSON.parse(profile.preferredPaymentMethods);

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        companyName: profile.companyName,
        businessDescription: profile.businessDescription,
        industry: profile.industry,
        supportPhone: profile.supportPhone,
        supportEmail: profile.supportEmail,
        businessHours,
        preferredPaymentMethods,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch business profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business-profile
 * Create or update business profile for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = result.session.userId;

    // Parse request body
    const body = await request.json();
    const {
      companyName,
      businessDescription,
      industry,
      supportPhone,
      supportEmail,
      businessHours,
      preferredPaymentMethods,
    } = body;

    // Validate required fields
    if (!companyName || !businessDescription || !supportPhone) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "companyName, businessDescription, and supportPhone are required",
        },
        { status: 400 }
      );
    }

    // Validate business description length (500 words max)
    const wordCount = businessDescription.trim().split(/\s+/).length;
    if (wordCount > 500) {
      return NextResponse.json(
        {
          error: "Business description too long",
          details: `Business description must be 500 words or less. Current: ${wordCount} words`,
        },
        { status: 400 }
      );
    }

    // Validate preferred payment methods
    if (!Array.isArray(preferredPaymentMethods)) {
      return NextResponse.json(
        {
          error: "Invalid preferred payment methods",
          details: "preferredPaymentMethods must be an array",
        },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingProfiles = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1);

    const profileData = {
      companyName: companyName.trim(),
      businessDescription: businessDescription.trim(),
      industry: industry?.trim() || null,
      supportPhone: supportPhone.trim(),
      supportEmail: supportEmail?.trim() || null,
      businessHours: businessHours ? JSON.stringify(businessHours) : null,
      preferredPaymentMethods: JSON.stringify(preferredPaymentMethods),
      updatedAt: new Date(),
    };

    let profile;

    if (existingProfiles.length > 0) {
      // Update existing profile
      const updated = await db
        .update(businessProfiles)
        .set(profileData)
        .where(eq(businessProfiles.userId, userId))
        .returning();
      
      profile = updated[0];
    } else {
      // Create new profile
      const created = await db
        .insert(businessProfiles)
        .values({
          id: nanoid(),
          userId,
          ...profileData,
        })
        .returning();
      
      profile = created[0];
    }

    // Parse JSON fields for response
    const businessHoursParsed = profile.businessHours 
      ? JSON.parse(profile.businessHours) 
      : null;
    const preferredPaymentMethodsParsed = JSON.parse(profile.preferredPaymentMethods);

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        companyName: profile.companyName,
        businessDescription: profile.businessDescription,
        industry: profile.industry,
        supportPhone: profile.supportPhone,
        supportEmail: profile.supportEmail,
        businessHours: businessHoursParsed,
        preferredPaymentMethods: preferredPaymentMethodsParsed,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      message: existingProfiles.length > 0 ? "Business profile updated" : "Business profile created",
    });
  } catch (error) {
    console.error("Error saving business profile:", error);
    return NextResponse.json(
      {
        error: "Failed to save business profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}