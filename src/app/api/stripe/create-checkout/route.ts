// src/app/api/stripe/create-checkout/route.ts
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teamCredits } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { stripe, getCreditPackage, calculateCustomPrice } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { teamId, packageId, customCredits } = body;

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Get the team credit record
    const teamCredit = await db.query.teamCredits.findFirst({
      where: eq(teamCredits.teamId, teamId),
      with: {
        team: true,
      },
    });

    if (!teamCredit) {
      return NextResponse.json({ error: "Team credits not found" }, { status: 404 });
    }

    // Verify user is the team owner
    if (teamCredit.team.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only team owner can purchase credits" }, { status: 403 });
    }

    // Determine credits and price
    let credits: number;
    let amount: number;
    let packageName: string;

    if (packageId === "custom") {
      if (!customCredits || customCredits <= 0) {
        return NextResponse.json({ error: "Invalid custom credits amount" }, { status: 400 });
      }
      credits = customCredits;
      amount = calculateCustomPrice(credits);
      packageName = `Custom Package - ${credits} credits`;
    } else {
      const pkg = getCreditPackage(packageId);
      if (!pkg || !("price" in pkg)) {
        return NextResponse.json({ error: "Invalid package ID" }, { status: 400 });
      }
      credits = pkg.credits;
      amount = pkg.price;
      packageName = pkg.name;
    }

    // Create or get Stripe customer
    let stripeCustomerId = teamCredit.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          teamId: teamId,
          userId: session.user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Update team credits with Stripe customer ID
      await db
        .update(teamCredits)
        .set({ stripeCustomerId: customer.id })
        .where(eq(teamCredits.teamId, teamId));
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: packageName,
              description: `${credits} AI Headshot Credits for ${teamCredit.team.name}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        teamId,
        userId: session.user.id,
        credits: credits.toString(),
        packageId,
      },
      success_url: `${process.env["NEXT_PUBLIC_APP_URL"]}/teams/${teamCredit.team.slug}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env["NEXT_PUBLIC_APP_URL"]}/teams/${teamCredit.team.slug}/credits?canceled=true`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
