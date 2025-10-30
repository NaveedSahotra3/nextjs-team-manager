// src/app/api/teams/[slug]/headshots/route.ts
import { eq, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers, headshots } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId"); // Optional filter by user
    const status = searchParams.get("status"); // Optional filter by status

    // Get team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify user is a member of the team
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, session.user.id)),
    });

    // Check if user has access to this team
    const isOwnerOrAdmin =
      team.ownerId === session.user.id ||
      (membership && ["owner", "admin"].includes(membership.role));

    if (!isOwnerOrAdmin && !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build query conditions
    const conditions = [eq(headshots.teamId, team.id)];

    // If not owner/admin, only show user's own headshots
    if (!isOwnerOrAdmin) {
      conditions.push(eq(headshots.userId, session.user.id));
    } else if (userId) {
      // Owner/admin can filter by specific user
      conditions.push(eq(headshots.userId, userId));
    }

    if (status) {
      conditions.push(eq(headshots.status, status as any));
    }

    // Fetch headshots
    const results = await db.query.headshots.findMany({
      where: and(...conditions),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [desc(headshots.createdAt)],
    });

    return NextResponse.json({
      headshots: results,
      total: results.length,
    });
  } catch (error) {
    console.error("Error fetching headshots:", error);
    return NextResponse.json({ error: "Failed to fetch headshots" }, { status: 500 });
  }
}
