import { eq, and, isNull, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teamMembers, teams, invitations } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.slug, slug)).limit(1);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is a member
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.userId, session.user.id),
          isNull(teamMembers.removedAt)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate date 7 days ago for weekly data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get total counts
    const [totalInvites] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(eq(invitations.teamId, team.id));

    const [totalSignups] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), isNull(teamMembers.removedAt)));

    const [totalFirstHeadshots] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.firstHeadshots, true),
          isNull(teamMembers.removedAt)
        )
      );

    const [totalHeadshotFav] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.headshotFav, true),
          isNull(teamMembers.removedAt)
        )
      );

    const [totalUploaded] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.uploadedToLinkedin, true),
          isNull(teamMembers.removedAt)
        )
      );

    // Get daily data for the past week
    const dailyData = await db
      .select({
        date: sql<string>`DATE(${teamMembers.joinedAt})`,
        signups: sql<number>`count(*)::int`,
        firstHeadshots: sql<number>`count(*) FILTER (WHERE ${teamMembers.firstHeadshots} = true)::int`,
        uploaded: sql<number>`count(*) FILTER (WHERE ${teamMembers.uploadedToLinkedin} = true)::int`,
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          isNull(teamMembers.removedAt),
          gte(teamMembers.joinedAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${teamMembers.joinedAt})`);

    // Get weekly invites count
    const [weeklyInvites] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(and(eq(invitations.teamId, team.id), gte(invitations.createdAt, sevenDaysAgo)));

    const [weeklySignups] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          isNull(teamMembers.removedAt),
          gte(teamMembers.joinedAt, sevenDaysAgo)
        )
      );

    const [weeklyFirstHeadshots] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.firstHeadshots, true),
          isNull(teamMembers.removedAt),
          gte(teamMembers.joinedAt, sevenDaysAgo)
        )
      );

    // Format daily data to ensure all 7 days are present
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const formattedDailyData = last7Days.map((date) => {
      const dayData = dailyData.find((d) => d.date === date);
      return {
        date,
        signups: dayData?.signups || 0,
        firstHeadshots: dayData?.firstHeadshots || 0,
        uploaded: dayData?.uploaded || 0,
      };
    });

    return NextResponse.json({
      totals: {
        invites: totalInvites?.count || 0,
        signups: totalSignups?.count || 0,
        firstHeadshots: totalFirstHeadshots?.count || 0,
        headshotFav: totalHeadshotFav?.count || 0,
        uploaded: totalUploaded?.count || 0,
      },
      weekly: {
        invites: weeklyInvites?.count || 0,
        signups: weeklySignups?.count || 0,
        firstHeadshots: weeklyFirstHeadshots?.count || 0,
      },
      daily: formattedDailyData,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
