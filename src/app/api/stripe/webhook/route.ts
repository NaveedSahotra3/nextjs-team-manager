// src/app/api/stripe/webhook/route.ts
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { teamCredits, payments } from "@/db/schema";
import { stripe } from "@/lib/stripe";

const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"]!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature found" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook event:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { teamId, userId, credits } = session.metadata || {};

  if (!teamId || !userId || !credits) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const creditsToAdd = parseInt(credits);
  const amount = session.amount_total || 0;

  // Create payment record
  const [payment] = await db
    .insert(payments)
    .values({
      teamId,
      userId,
      amount: amount.toString(),
      currency: session.currency || "usd",
      creditsAdded: creditsToAdd.toString(),
      status: "succeeded",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
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

  if (payment) {
    console.log(`Added ${creditsToAdd} credits to team ${teamId}. Payment ID: ${payment.id}`);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Update payment status if needed
  await db
    .update(payments)
    .set({
      status: "succeeded",
      completedAt: new Date(),
    })
    .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Update payment status to failed
  await db
    .update(payments)
    .set({
      status: "failed",
    })
    .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
}
