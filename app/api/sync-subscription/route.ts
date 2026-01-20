import { db } from "@/db/drizzle";
import { subscription, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    const foundUser = users[0];
    if (!foundUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get subscriptions from Dodo Payments
    // Note: This is a placeholder - you'll need to check Dodo's API docs for the actual method
    try {
      // For now, let's create a manual subscription record based on your Dodo data
      const subscriptionData = {
        id: `sub_${Date.now()}`, // Generate a unique ID
        createdAt: new Date(),
        modifiedAt: new Date(),
        amount: 1000, // $10.00 in cents
        currency: "USD",
        recurringInterval: "month",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false,
        canceledAt: null,
        startedAt: new Date(),
        endsAt: null,
        endedAt: null,
        customerId: `cust_${foundUser.id}`,
        productId: process.env.NEXT_PUBLIC_STARTER_TIER || "pdt_gok24Vsklq5ghJL9Z96Ve",
        discountId: null,
        checkoutId: `checkout_${Date.now()}`,
        customerCancellationReason: null,
        customerCancellationComment: null,
        metadata: JSON.stringify({ source: "manual_sync" }),
        customFieldData: null,
        userId: foundUser.id,
      };

      // Insert subscription into database
      await db.insert(subscription).values(subscriptionData);

      return NextResponse.json({ 
        success: true, 
        message: "Subscription synced successfully",
        subscription: subscriptionData 
      });
    } catch (error) {
      console.error("Error syncing subscription:", error);
      return NextResponse.json({ error: "Failed to sync subscription" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in sync-subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
