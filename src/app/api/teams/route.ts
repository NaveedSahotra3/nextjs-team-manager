import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { createTeamSchema } from "@/lib/validations";

/**
 * GET /api/teams
 * Get all teams for the authenticated user (owned + member of)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teams where user is an active member (excludes removed members)
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        slug: teams.slug,
        description: teams.description,
        ownerId: teams.ownerId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(eq(teamMembers.userId, session.user.id), isNull(teamMembers.removedAt)));

    return NextResponse.json({ teams: userTeams }, { status: 200 });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTeamSchema.parse(body);

    // Check if slug is already taken
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.slug, validatedData.slug),
    });

    if (existingTeam) {
      return NextResponse.json({ error: "Team slug is already taken" }, { status: 400 });
    }

    // Create team
    const [newTeam] = await db
      .insert(teams)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description || null,
        ownerId: session.user.id,
      })
      .returning();

    // Add owner as a team member with owner role
    if (newTeam) {
      await db.insert(teamMembers).values({
        teamId: newTeam.id,
        userId: session.user.id,
        role: "owner",
      });
    }

    return NextResponse.json(
      { team: newTeam, message: "Team created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data", details: error }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
