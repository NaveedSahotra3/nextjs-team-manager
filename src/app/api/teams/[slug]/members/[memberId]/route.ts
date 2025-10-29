import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { updateMemberRoleSchema } from "@/lib/validations";

/**
 * PATCH /api/teams/[slug]/members/[memberId]
 * Update a team member's role
 */
export async function PATCH(
  request: Request,
  { params }: { params: { slug: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, memberId } = params;
    const body = await request.json();
    const validatedData = updateMemberRoleSchema.parse({
      ...body,
      memberId,
    });

    // Get team
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if current user is owner or admin (exclude removed members)
    const currentUserMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, team.id),
        eq(teamMembers.userId, session.user.id),
        isNull(teamMembers.removedAt)
      ),
    });

    if (
      !currentUserMembership ||
      (currentUserMembership.role !== "owner" && currentUserMembership.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Only owners and admins can change member roles" },
        { status: 403 }
      );
    }

    // Get target member
    const targetMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, validatedData.memberId),
    });

    if (!targetMember || targetMember.teamId !== team.id) {
      return NextResponse.json({ error: "Member not found in this team" }, { status: 404 });
    }

    // Prevent changing owner role
    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 400 });
    }

    // Prevent non-owners from creating admins
    if (validatedData.role === "admin" && currentUserMembership.role !== "owner") {
      return NextResponse.json({ error: "Only owners can assign admin role" }, { status: 403 });
    }

    // Prevent changing to owner role
    if (validatedData.role === "owner") {
      return NextResponse.json(
        { error: "Cannot assign owner role. Use ownership transfer instead." },
        { status: 400 }
      );
    }

    // Update member role
    await db
      .update(teamMembers)
      .set({ role: validatedData.role })
      .where(eq(teamMembers.id, validatedData.memberId));

    return NextResponse.json({ message: "Member role updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating member role:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data", details: error }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
}

/**
 * DELETE /api/teams/[slug]/members/[memberId]
 * Remove a member from the team
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, memberId } = params;

    // Get team
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get target member
    const targetMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId),
      with: {
        user: true,
      },
    });

    if (!targetMember || targetMember.teamId !== team.id) {
      return NextResponse.json({ error: "Member not found in this team" }, { status: 404 });
    }

    // Prevent removing the owner
    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the team owner" }, { status: 400 });
    }

    // Check permissions: owners and admins can remove members
    // Members can only remove themselves (exclude removed members)
    const currentUserMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, team.id),
        eq(teamMembers.userId, session.user.id),
        isNull(teamMembers.removedAt)
      ),
    });

    const isOwnerOrAdmin =
      currentUserMembership &&
      (currentUserMembership.role === "owner" || currentUserMembership.role === "admin");

    const isRemovingSelf = targetMember.userId === session.user.id;

    if (!isOwnerOrAdmin && !isRemovingSelf) {
      return NextResponse.json(
        { error: "You don't have permission to remove this member" },
        { status: 403 }
      );
    }

    // Soft delete: Mark member as removed instead of hard delete
    await db
      .update(teamMembers)
      .set({
        removedAt: new Date(),
        removedBy: session.user.id,
      })
      .where(eq(teamMembers.id, memberId));

    return NextResponse.json(
      {
        message: isRemovingSelf ? "You have left the team" : "Member removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
