// src/app/api/stripe/verify-payment/route.ts
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teamCredits, payments } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/stripe/verify-payment
 * Verify a Stripe checkout session and add credits
 * This is used for local development where webhooks don't work
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!checkoutSession) {
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const { teamId, userId, credits } = checkoutSession.metadata || {};

    if (!teamId || !userId || !credits) {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    // Verify the user owns this checkout session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if payment already recorded
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.stripeCheckoutSessionId, sessionId),
    });

    if (existingPayment) {
      // Payment already processed
      return NextResponse.json({
        success: true,
        message: "Credits already added",
        creditsAdded: parseInt(existingPayment.creditsAdded),
      });
    }

    const creditsToAdd = parseInt(credits);
    const amount = checkoutSession.amount_total || 0;

    // Create payment record
    const [payment] = await db
      .insert(payments)
      .values({
        teamId,
        userId,
        amount: amount.toString(),
        currency: checkoutSession.currency || "usd",
        creditsAdded: creditsToAdd.toString(),
        status: "succeeded",
        stripeCheckoutSessionId: sessionId,
        stripePaymentIntentId: checkoutSession.payment_intent as string,
        completedAt: new Date(),
      })
      .returning();

    // Add credits to team
    await db
      .update(teamCredits)
      .set({
        totalCredits: sql`CAST(${teamCredits.totalCredits} AS INTEGER) + ${creditsToAdd}`,
        updatedAt: new Date(),
      })
      .where(eq(teamCredits.teamId, teamId));

    return NextResponse.json({
      success: true,
      message: "Credits added successfully",
      creditsAdded: creditsToAdd,
      paymentId: payment?.id,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
