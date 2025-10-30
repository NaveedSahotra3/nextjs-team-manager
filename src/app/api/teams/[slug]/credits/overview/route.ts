// src/app/api/teams/[slug]/credits/overview/route.ts
import { eq, and, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getTeamCreditOverview, initializeTeamCredits } from "@/lib/credits";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      where: and(
        eq(teamMembers.teamId, team.id),
        eq(teamMembers.userId, session.user.id),
        isNull(teamMembers.removedAt)
      ),
    });

    // Check if user has access to this team
    if (team.ownerId !== session.user.id && !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let overview = await getTeamCreditOverview(team.id);

    // If credits don't exist yet, initialize them
    if (!overview) {
      await initializeTeamCredits(team.id, 1, 20);
      overview = await getTeamCreditOverview(team.id);

      // If still null after initialization, something went wrong
      if (!overview) {
        return NextResponse.json({ error: "Failed to initialize team credits" }, { status: 500 });
      }
    }

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error fetching credit overview:", error);
    return NextResponse.json({ error: "Failed to fetch credit overview" }, { status: 500 });
  }
}
