import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';


export async function GET() {
  // Test environment variables
  const envCheck = {
    DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY ? "✅ Set" : "❌ Missing",
    DODO_PAYMENTS_WEBHOOK_SECRET: process.env.DODO_PAYMENTS_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing",
    NEXT_PUBLIC_STARTER_TIER: process.env.NEXT_PUBLIC_STARTER_TIER ? "✅ Set" : "❌ Missing",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? "✅ Set" : "❌ Missing",
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? "✅ Set" : "❌ Missing",
  };

  return NextResponse.json({
    message: "Dodo Payments Environment Check",
    environment: envCheck,
    nodeEnv: process.env.NODE_ENV,
  });
}
