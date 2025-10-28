import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers, invitations } from "@/db/schema";
import { authOptions } from "@/lib/auth";

/**
 * DELETE /api/teams/[slug]/invitations/[invitationId]
 * Revoke/cancel a pending invitation
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string; invitationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, invitationId } = params;

    // Get team
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user has admin access
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, session.user.id)),
    });

    const hasAccess =
      team.ownerId === session.user.id ||
      (membership && (membership.role === "admin" || membership.role === "owner"));

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Only team owners and admins can revoke invitations" },
        { status: 403 }
      );
    }

    // Get invitation
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, invitationId),
    });

    if (!invitation || invitation.teamId !== team.id) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot revoke ${invitation.status} invitation` },
        { status: 400 }
      );
    }

    // Delete the invitation (or mark as revoked if you want to keep history)
    await db.delete(invitations).where(eq(invitations.id, invitationId));

    return NextResponse.json({ message: "Invitation revoked successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error revoking invitation:", error);
    return NextResponse.json({ error: "Failed to revoke invitation" }, { status: 500 });
  }
}
