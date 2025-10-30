// src/app/api/teams/[slug]/credits/allocate/route.ts
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { allocateCreditsToMember } from "@/lib/credits";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, credits } = body;

    if (!userId || credits === undefined || credits <= 0) {
      return NextResponse.json({ error: "Invalid user ID or credits amount" }, { status: 400 });
    }

    // Get team by slug
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
        { error: "Only team owner or admin can allocate credits" },
        { status: 403 }
      );
    }

    // Verify target user is a member of the team
    const targetMembership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)),
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Target user is not a member of this team" },
        { status: 404 }
      );
    }

    // Allocate credits
    const allocation = await allocateCreditsToMember(team.id, userId, credits);

    return NextResponse.json({
      success: true,
      allocation,
    });
  } catch (error) {
    console.error("Error allocating credits:", error);
    return NextResponse.json({ error: "Failed to allocate credits" }, { status: 500 });
  }
}
