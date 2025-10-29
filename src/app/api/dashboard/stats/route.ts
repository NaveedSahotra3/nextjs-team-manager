import { eq, and, count, sql, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers, invitations, users } from "@/db/schema";
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

    // Get all unique teams where user is owner OR member
    const ownedTeamIds = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.ownerId, currentUser.id));

    const memberTeamIds = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, currentUser.id), isNull(teamMembers.removedAt)));

    // Combine and deduplicate team IDs
    const allTeamIds = new Set([
      ...ownedTeamIds.map((t) => t.id),
      ...memberTeamIds.map((t) => t.teamId),
    ]);
    const totalTeams = allTeamIds.size;

    // Get active invitations count (pending invitations sent from user's teams)
    const activeInvitationsResult = await db
      .select({ count: count() })
      .from(invitations)
      .innerJoin(teams, eq(invitations.teamId, teams.id))
      .where(and(eq(teams.ownerId, currentUser.id), eq(invitations.status, "pending")));

    const activeInvitations = activeInvitationsResult[0]?.count ?? 0;

    // Get total team members count across all teams user owns
    // This counts actual members in team_members table (NOT including owner, excluding removed)
    const teamMembersResult = await db
      .select({ count: count() })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(eq(teams.ownerId, currentUser.id), isNull(teamMembers.removedAt)));

    const membersCount = teamMembersResult[0]?.count ?? 0;

    // Add owner count (1 per team owned)
    const ownedTeamsCount = ownedTeamIds.length;

    // Total = members + owners (you count once per team you own)
    const totalMembers = membersCount + ownedTeamsCount;

    // Get recent activity count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count teams created in last 7 days
    const recentTeamsResult = await db
      .select({ count: count() })
      .from(teams)
      .where(and(eq(teams.ownerId, currentUser.id), sql`${teams.createdAt} >= ${sevenDaysAgo}`));

    // Count invitations sent in last 7 days
    const recentInvitationsResult = await db
      .select({ count: count() })
      .from(invitations)
      .innerJoin(teams, eq(invitations.teamId, teams.id))
      .where(
        and(eq(teams.ownerId, currentUser.id), sql`${invitations.createdAt} >= ${sevenDaysAgo}`)
      );

    const recentActivity =
      (recentTeamsResult[0]?.count ?? 0) + (recentInvitationsResult[0]?.count ?? 0);

    return NextResponse.json({
      stats: {
        totalTeams,
        activeInvitations,
        totalMembers,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
