// src/lib/credits.ts
import { eq, and, sql } from "drizzle-orm";

import { db } from "@/db";
import { teamCredits, memberCredits } from "@/db/schema";

/**
 * Initialize credit tracking for a new team
 */
export async function initializeTeamCredits(teamId: string) {
  const [teamCredit] = await db
    .insert(teamCredits)
    .values({
      teamId,
      totalCredits: "0", // No credits until payment
      usedCredits: "0",
    })
    .returning();

  return teamCredit;
}

/**
 * Add credits to a team after successful payment
 */
export async function addCreditsToTeam(teamId: string, creditsToAdd: number, _paymentId: string) {
  const [updated] = await db
    .update(teamCredits)
    .set({
      totalCredits: sql`CAST(${teamCredits.totalCredits} AS INTEGER) + ${creditsToAdd}`,
      updatedAt: new Date(),
    })
    .where(eq(teamCredits.teamId, teamId))
    .returning();

  return updated;
}

/**
 * Allocate credits to a team member
 */
export async function allocateCreditsToMember(
  teamId: string,
  userId: string,
  creditsToAllocate: number
) {
  // Check if member already has credit allocation
  const existing = await db.query.memberCredits.findFirst({
    where: and(eq(memberCredits.teamId, teamId), eq(memberCredits.userId, userId)),
  });

  if (existing) {
    // Update existing allocation
    const [updated] = await db
      .update(memberCredits)
      .set({
        allocatedCredits: sql`CAST(${memberCredits.allocatedCredits} AS INTEGER) + ${creditsToAllocate}`,
        updatedAt: new Date(),
      })
      .where(and(eq(memberCredits.teamId, teamId), eq(memberCredits.userId, userId)))
      .returning();
    return updated;
  } else {
    // Create new allocation
    const [created] = await db
      .insert(memberCredits)
      .values({
        teamId,
        userId,
        allocatedCredits: creditsToAllocate.toString(),
        usedCredits: "0",
      })
      .returning();
    return created;
  }
}

/**
 * Auto-distribute credits equally among all team members
 */
export async function autoDistributeCredits(teamId: string) {
  // Get team credits
  const teamCredit = await db.query.teamCredits.findFirst({
    where: eq(teamCredits.teamId, teamId),
  });

  if (!teamCredit) {
    throw new Error("Team credits not found");
  }

  // Get all team members
  const members = await db.query.teamMembers.findMany({
    where: eq(memberCredits.teamId, teamId),
  });

  if (members.length === 0) {
    return [];
  }

  const totalCredits = parseInt(teamCredit.totalCredits);
  const creditsPerMember = Math.floor(totalCredits / members.length);

  // Allocate credits to each member
  const allocations = await Promise.all(
    members.map((member) => allocateCreditsToMember(teamId, member.userId, creditsPerMember))
  );

  return allocations;
}

/**
 * Deduct credits when generating headshots
 */
export async function deductCreditsForHeadshot(
  teamId: string,
  userId: string,
  creditsToDeduct: number = 1
) {
  // Check if member has enough credits
  const memberCredit = await db.query.memberCredits.findFirst({
    where: and(eq(memberCredits.teamId, teamId), eq(memberCredits.userId, userId)),
  });

  if (!memberCredit) {
    throw new Error("Member credit allocation not found");
  }

  const allocated = parseInt(memberCredit.allocatedCredits);
  const used = parseInt(memberCredit.usedCredits);
  const available = allocated - used;

  if (available < creditsToDeduct) {
    throw new Error("Insufficient credits");
  }

  // Deduct from member credits
  await db
    .update(memberCredits)
    .set({
      usedCredits: sql`CAST(${memberCredits.usedCredits} AS INTEGER) + ${creditsToDeduct}`,
      updatedAt: new Date(),
    })
    .where(and(eq(memberCredits.teamId, teamId), eq(memberCredits.userId, userId)));

  // Deduct from team credits
  await db
    .update(teamCredits)
    .set({
      usedCredits: sql`CAST(${teamCredits.usedCredits} AS INTEGER) + ${creditsToDeduct}`,
      updatedAt: new Date(),
    })
    .where(eq(teamCredits.teamId, teamId));

  return true;
}

/**
 * Get credit balance for a member
 */
export async function getMemberCreditBalance(teamId: string, userId: string) {
  const memberCredit = await db.query.memberCredits.findFirst({
    where: and(eq(memberCredits.teamId, teamId), eq(memberCredits.userId, userId)),
  });

  if (!memberCredit) {
    return {
      allocated: 0,
      used: 0,
      available: 0,
    };
  }

  const allocated = parseInt(memberCredit.allocatedCredits);
  const used = parseInt(memberCredit.usedCredits);

  return {
    allocated,
    used,
    available: allocated - used,
  };
}

/**
 * Get credit overview for entire team
 */
export async function getTeamCreditOverview(teamId: string) {
  const teamCredit = await db.query.teamCredits.findFirst({
    where: eq(teamCredits.teamId, teamId),
  });

  if (!teamCredit) {
    return null;
  }

  const total = parseInt(teamCredit.totalCredits);
  const used = parseInt(teamCredit.usedCredits);

  // Get all member credits
  const allMemberCredits = await db.query.memberCredits.findMany({
    where: eq(memberCredits.teamId, teamId),
    with: {
      user: true,
    },
  });

  const memberBreakdown = allMemberCredits.map((mc) => ({
    userId: mc.userId,
    userName: mc.user?.name || mc.user?.email || "Unknown",
    allocated: parseInt(mc.allocatedCredits),
    used: parseInt(mc.usedCredits),
    available: parseInt(mc.allocatedCredits) - parseInt(mc.usedCredits),
  }));

  return {
    teamId,
    total,
    used,
    available: total - used,
    memberBreakdown,
  };
}

/**
 * Reassign credits between members
 */
export async function reassignCredits(
  teamId: string,
  fromUserId: string,
  toUserId: string,
  creditsToMove: number
) {
  // Get source member credits
  const fromMember = await db.query.memberCredits.findFirst({
    where: and(eq(memberCredits.teamId, teamId), eq(memberCredits.userId, fromUserId)),
  });

  if (!fromMember) {
    throw new Error("Source member credit allocation not found");
  }

  const fromAllocated = parseInt(fromMember.allocatedCredits);
  const fromUsed = parseInt(fromMember.usedCredits);
  const fromAvailable = fromAllocated - fromUsed;

  if (fromAvailable < creditsToMove) {
    throw new Error("Source member has insufficient available credits");
  }

  // Deduct from source
  await db
    .update(memberCredits)
    .set({
      allocatedCredits: sql`CAST(${memberCredits.allocatedCredits} AS INTEGER) - ${creditsToMove}`,
      updatedAt: new Date(),
    })
    .where(and(eq(memberCredits.teamId, teamId), eq(memberCredits.userId, fromUserId)));

  // Add to destination
  await allocateCreditsToMember(teamId, toUserId, creditsToMove);

  return true;
}
