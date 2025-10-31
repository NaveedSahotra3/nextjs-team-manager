import { eq, and, isNull, gte, sql } from "drizzle-orm";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { teamMembers, teams, invitations } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserTeams, getDefaultTeam } from "@/lib/teams";

async function getAnalytics(teamSlug: string, _userId: string) {
  try {
    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.slug, teamSlug)).limit(1);

    if (!team) {
      return null;
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
    const dailyDataRaw = await db
      .select({
        date: sql<string>`DATE(${teamMembers.joinedAt})::text`,
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

    // Filter out any entries with undefined dates
    const dailyData = dailyDataRaw.filter(
      (d): d is { date: string; signups: number; firstHeadshots: number; uploaded: number } =>
        d.date !== null && d.date !== undefined
    );

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
    const last7Days: string[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0]!;
    });

    const formattedDailyData = last7Days.map((date) => ({
      date,
      signups: dailyData.find((d) => d.date === date)?.signups ?? 0,
      firstHeadshots: dailyData.find((d) => d.date === date)?.firstHeadshots ?? 0,
      uploaded: dailyData.find((d) => d.date === date)?.uploaded ?? 0,
    }));

    return {
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
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const teams = await getUserTeams(session.user.id);
  const defaultTeam = await getDefaultTeam(session.user.id);

  let analyticsData = null;
  if (defaultTeam) {
    analyticsData = await getAnalytics(defaultTeam.slug, session.user.id);
  }

  return (
    <AppShell
      userName={session.user.name ?? "User"}
      userEmail={session.user.email ?? ""}
      teams={teams}
      currentTeam={defaultTeam ?? undefined}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {defaultTeam
              ? `Analytics and metrics for ${defaultTeam.name}`
              : "Create a team to get started"}
          </p>
        </div>

        {defaultTeam && analyticsData ? (
          <AnalyticsCharts data={analyticsData} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Team Selected</CardTitle>
              <CardDescription>
                Create your first team to start tracking metrics and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/teams/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Team
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
