// src/app/api/teams/[slug]/credits/auto-distribute/route.ts
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { autoDistributeCredits } from "@/lib/credits";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        { error: "Only team owner or admin can distribute credits" },
        { status: 403 }
      );
    }

    // Auto-distribute credits
    const allocations = await autoDistributeCredits(team.id);

    return NextResponse.json({
      success: true,
      allocations,
    });
  } catch (error) {
    console.error("Error auto-distributing credits:", error);
    return NextResponse.json({ error: "Failed to auto-distribute credits" }, { status: 500 });
  }
}
