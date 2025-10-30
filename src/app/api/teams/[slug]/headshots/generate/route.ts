// src/app/api/teams/[slug]/headshots/generate/route.ts
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers, headshots } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { deductCreditsForHeadshot, getMemberCreditBalance } from "@/lib/credits";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { inputImages, style, creditsCost = 1 } = body;

    if (!inputImages || !Array.isArray(inputImages) || inputImages.length === 0) {
      return NextResponse.json({ error: "Input images are required" }, { status: 400 });
    }

    // Get team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify user is a member of the team
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, session.user.id)),
    });

    // Check if user has access to this team
    if (team.ownerId !== session.user.id && !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check credit balance
    const balance = await getMemberCreditBalance(team.id, session.user.id);

    if (balance.available < creditsCost) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          available: balance.available,
          required: creditsCost,
        },
        { status: 402 }
      );
    }

    // Create headshot record with pending status
    const [headshot] = await db
      .insert(headshots)
      .values({
        teamId: team.id,
        userId: session.user.id,
        status: "pending",
        inputImages,
        style: style || "professional",
        creditsCost: creditsCost.toString(),
      })
      .returning();

    if (!headshot) {
      return NextResponse.json({ error: "Failed to create headshot record" }, { status: 500 });
    }

    // Deduct credits immediately
    try {
      await deductCreditsForHeadshot(team.id, session.user.id, creditsCost);
    } catch (error: any) {
      // If credit deduction fails, mark headshot as failed
      await db
        .update(headshots)
        .set({
          status: "failed",
          errorMessage: error.message || "Failed to deduct credits",
        })
        .where(eq(headshots.id, headshot.id));

      return NextResponse.json(
        { error: error.message || "Failed to deduct credits" },
        { status: 500 }
      );
    }

    // Update headshot status to processing
    await db.update(headshots).set({ status: "processing" }).where(eq(headshots.id, headshot.id));

    // TODO: Here you would trigger your AI headshot generation service
    // For now, we'll just simulate the process
    // In production, you would:
    // 1. Send inputImages to your AI service (Replicate, Stable Diffusion, etc.)
    // 2. Wait for processing (or use webhooks)
    // 3. Update the headshot record with outputImages when complete

    // Example placeholder for AI service integration:
    /*
    try {
      const outputImages = await generateHeadshotsWithAI({
        inputImages,
        style,
        headshotId: headshot.id,
      });

      await db
        .update(headshots)
        .set({
          status: "completed",
          outputImages,
          completedAt: new Date(),
        })
        .where(eq(headshots.id, headshot.id));
    } catch (aiError) {
      await db
        .update(headshots)
        .set({
          status: "failed",
          errorMessage: aiError.message,
        })
        .where(eq(headshots.id, headshot.id));
    }
    */

    return NextResponse.json({
      success: true,
      headshotId: headshot.id,
      status: headshot.status,
      message: "Headshot generation started. Credits have been deducted.",
      creditsRemaining: balance.available - creditsCost,
    });
  } catch (error) {
    console.error("Error generating headshot:", error);
    return NextResponse.json({ error: "Failed to generate headshot" }, { status: 500 });
  }
}
