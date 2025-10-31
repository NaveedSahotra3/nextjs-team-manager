import { eq, and, isNull } from "drizzle-orm";

import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";

export async function getUserTeams(userId: string) {
  const userTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      role: teamMembers.role,
      ownerId: teams.ownerId,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(eq(teamMembers.userId, userId), isNull(teamMembers.removedAt)));

  return userTeams;
}

export async function getDefaultTeam(userId: string) {
  const userTeams = await getUserTeams(userId);

  // Return the first team (could be enhanced to return the last accessed team)
  return userTeams.length > 0 ? userTeams[0] : null;
}
