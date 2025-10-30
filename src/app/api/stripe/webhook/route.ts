import { NextResponse } from "next/server";

// STRIPE FUNCTIONALITY - TEMPORARILY DISABLED
// This endpoint is commented out for now
export async function GET() {
  return NextResponse.json({ error: "Stripe functionality temporarily disabled" }, { status: 503 });
}

export async function POST() {
  return NextResponse.json({ error: "Stripe functionality temporarily disabled" }, { status: 503 });
}
