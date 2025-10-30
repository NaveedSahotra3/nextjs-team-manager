// src/app/api/teams/[slug]/headshots/[headshotId]/route.ts
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers, headshots } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export async function GET(
  __req: NextRequest,
  { params }: { params: Promise<{ slug: string; headshotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { slug, headshotId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Fetch headshot
    const headshot = await db.query.headshots.findFirst({
      where: and(eq(headshots.id, headshotId), eq(headshots.teamId, team.id)),
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
    });

    if (!headshot) {
      return NextResponse.json({ error: "Headshot not found" }, { status: 404 });
    }

    // Verify user is a member of the team
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, session.user.id)),
    });

    // Check access rights
    const isOwner = team.ownerId === session.user.id;
    const isOwnerOfHeadshot = headshot.userId === session.user.id;
    const isAdmin = membership && ["owner", "admin"].includes(membership.role);

    if (!isOwner && !isOwnerOfHeadshot && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(headshot);
  } catch (error) {
    console.error("Error fetching headshot:", error);
    return NextResponse.json({ error: "Failed to fetch headshot" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; headshotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { slug, headshotId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, outputImages, errorMessage } = body;

    // Get team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Fetch headshot
    const headshot = await db.query.headshots.findFirst({
      where: and(eq(headshots.id, headshotId), eq(headshots.teamId, team.id)),
    });

    if (!headshot) {
      return NextResponse.json({ error: "Headshot not found" }, { status: 404 });
    }

    // Only allow updating if user is owner or the headshot belongs to them
    if (team.ownerId !== session.user.id && headshot.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update headshot
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (outputImages) {
      updateData.outputImages = outputImages;
    }
    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(headshots)
      .set(updateData)
      .where(eq(headshots.id, headshotId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating headshot:", error);
    return NextResponse.json({ error: "Failed to update headshot" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; headshotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { slug, headshotId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Fetch headshot
    const headshot = await db.query.headshots.findFirst({
      where: and(eq(headshots.id, headshotId), eq(headshots.teamId, team.id)),
    });

    if (!headshot) {
      return NextResponse.json({ error: "Headshot not found" }, { status: 404 });
    }

    // Only allow deletion if user is owner or the headshot belongs to them
    if (team.ownerId !== session.user.id && headshot.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await db.delete(headshots).where(eq(headshots.id, headshotId));

    return NextResponse.json({
      success: true,
      message: "Headshot deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting headshot:", error);
    return NextResponse.json({ error: "Failed to delete headshot" }, { status: 500 });
  }
}
