import { eq, isNull, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { updateTeamSchema } from "@/lib/validations";

/**
 * GET /api/teams/[slug]
 * Get team details with members
 */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;

    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user has access to this team (owner or active member)
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, team.id),
        eq(teamMembers.userId, session.user.id),
        isNull(teamMembers.removedAt)
      ),
    });

    const hasAccess = team.ownerId === session.user.id || membership !== undefined;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all active team members with user details (exclude removed members)
    const membersRaw = await db
      .select({
        id: teamMembers.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(and(eq(teamMembers.teamId, team.id), isNull(teamMembers.removedAt)));

    return NextResponse.json(
      {
        ...team,
        members: membersRaw,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

/**
 * PATCH /api/teams/[slug]
 * Update team details (owner only)
 */
export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    const body = await request.json();
    const validatedData = updateTeamSchema.parse(body);

    // Get team
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is the owner
    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team owner can update team settings" },
        { status: 403 }
      );
    }

    // Update team
    const [updatedTeam] = await db
      .update(teams)
      .set({
        name: validatedData.name ?? team.name,
        description: validatedData.description ?? team.description,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, team.id))
      .returning();

    return NextResponse.json(
      { team: updatedTeam, message: "Team updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating team:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data", details: error }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

/**
 * DELETE /api/teams/[slug]
 * Delete a team (owner only)
 */
export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;

    // Get team
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is the owner
    if (team.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only team owner can delete the team" }, { status: 403 });
    }

    // Delete team (cascade will handle members and invitations)
    await db.delete(teams).where(eq(teams.id, team.id));

    return NextResponse.json({ message: "Team deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
