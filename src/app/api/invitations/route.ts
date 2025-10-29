import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { invitations, teams, users, teamMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get teams owned by the user
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        slug: teams.slug,
      })
      .from(teams)
      .where(eq(teams.ownerId, currentUser.id));

    // Get all invitations for those teams
    const userInvitations = await db
      .select({
        id: invitations.id,
        teamId: invitations.teamId,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
        acceptedAt: invitations.acceptedAt,
      })
      .from(invitations)
      .innerJoin(teams, eq(invitations.teamId, teams.id))
      .where(eq(teams.ownerId, currentUser.id))
      .orderBy(invitations.createdAt);

    // For each accepted invitation, check if the member is still active (not removed)
    const invitationsWithMemberStatus = await Promise.all(
      userInvitations.map(async (inv) => {
        let isActive = true;

        // If invitation is accepted, check if member is still active
        if (inv.status === "accepted") {
          const user = await db.query.users.findFirst({
            where: eq(users.email, inv.email),
          });

          if (user) {
            const membership = await db.query.teamMembers.findFirst({
              where: and(eq(teamMembers.teamId, inv.teamId), eq(teamMembers.userId, user.id)),
            });

            // If member doesn't exist or is removed, mark as inactive
            if (!membership || membership.removedAt) {
              isActive = false;
            }
          }
        }

        return { ...inv, isActive };
      })
    );

    // Group invitations by team and filter out accepted invitations where member was removed
    const teamsWithInvitations = userTeams.map((team) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      invitations: invitationsWithMemberStatus
        .filter((inv) => inv.teamId === team.id)
        // Filter out accepted invitations where member was removed
        .filter((inv) => inv.status !== "accepted" || inv.isActive)
        .map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          expiresAt: inv.expiresAt.toISOString(),
          createdAt: inv.createdAt.toISOString(),
          acceptedAt: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
        })),
    }));

    return NextResponse.json({
      teams: teamsWithInvitations,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}
