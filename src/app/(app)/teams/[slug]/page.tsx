import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { TeamManagement } from "@/components/teams/TeamManagement";
import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserTeams } from "@/lib/teams";

export default async function TeamPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userTeams = await getUserTeams(session.user.id);

  // Get the current team
  const [team] = await db.select().from(teams).where(eq(teams.slug, params.slug)).limit(1);

  if (!team) {
    redirect("/dashboard");
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
    redirect("/dashboard");
  }

  const currentTeam = userTeams.find((t) => t.slug === params.slug);

  return (
    <AppShell
      userName={session.user.name ?? "User"}
      userEmail={session.user.email ?? ""}
      teams={userTeams}
      currentTeam={currentTeam}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-muted-foreground">
            {team.description || "Manage your team members and invitations"}
          </p>
        </div>

        <TeamManagement
          teamId={team.id}
          teamSlug={team.slug}
          userId={session.user.id}
          userRole={membership.role}
        />
      </div>
    </AppShell>
  );
}
