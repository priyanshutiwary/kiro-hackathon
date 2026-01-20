import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log("🔍 Test webhook received:");
    console.log("📦 Headers:", JSON.stringify(headers, null, 2));
    console.log("📦 Body:", body);
    
    return NextResponse.json({ 
      success: true, 
      message: "Test webhook received successfully",
      headers,
      body: body.substring(0, 200) + "..." // Truncate for logging
    });
  } catch (error) {
    console.error("❌ Test webhook error:", error);
    return NextResponse.json({ error: "Test webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Test webhook endpoint is working",
    timestamp: new Date().toISOString()
  });
}
