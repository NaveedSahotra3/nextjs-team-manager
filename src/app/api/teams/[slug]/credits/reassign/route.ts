// src/app/api/teams/[slug]/credits/reassign/route.ts
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { reassignCredits } from "@/lib/credits";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fromUserId, toUserId, credits } = body;

    if (!fromUserId || !toUserId || credits === undefined || credits <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Verify team exists and user is owner or admin
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is owner or admin
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, session.user.id)),
    });

    if (
      team.ownerId !== session.user.id &&
      (!membership || !["owner", "admin"].includes(membership.role))
    ) {
      return NextResponse.json(
        { error: "Only team owner or admin can reassign credits" },
        { status: 403 }
      );
    }

    // Reassign credits
    await reassignCredits(team.id, fromUserId, toUserId, credits);

    return NextResponse.json({
      success: true,
      message: `Successfully reassigned ${credits} credits`,
    });
  } catch (error: any) {
    console.error("Error reassigning credits:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reassign credits" },
      { status: 500 }
    );
  }
}
