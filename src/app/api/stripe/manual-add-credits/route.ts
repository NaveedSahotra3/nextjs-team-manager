// src/app/api/stripe/manual-add-credits/route.ts
// TEMPORARY ENDPOINT FOR DEVELOPMENT - Remove in production
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teamCredits, payments, teams } from "@/db/schema";
import { authOptions } from "@/lib/auth";
// testing
/**
 * POST /api/stripe/manual-add-credits
 * Manually add credits to a team (for development/testing only)
 * This bypasses Stripe and directly adds credits to the database
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //eslint-diable-next-line
    const { teamSlug, credits, amount = 7900 } = await req.json();

    if (!teamSlug || !credits) {
      return NextResponse.json(
        { error: "Team slug and credits amount are required" },
        { status: 400 }
      );
    }

    // Get team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, teamSlug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify user is the owner
    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team owner can manually add credits" },
        { status: 403 }
      );
    }

    const creditsToAdd = parseInt(credits);

    // Create payment record (marked as manual)
    const [payment] = await db
      .insert(payments)
      .values({
        teamId: team.id,
        userId: session.user.id,
        amount: amount.toString(),
        currency: "usd",
        creditsAdded: creditsToAdd.toString(),
        status: "succeeded",
        stripeCheckoutSessionId: `manual_${Date.now()}`,
        stripePaymentIntentId: `manual_${Date.now()}`,
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
      .where(eq(teamCredits.teamId, team.id));

    return NextResponse.json({
      success: true,
      message: "Credits added successfully (manual)",
      creditsAdded: creditsToAdd,
      paymentId: payment?.id,
      warning: "This is a development-only endpoint. Remove in production.",
    });
  } catch (error) {
    console.error("Error manually adding credits:", error);
    return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
  }
}
