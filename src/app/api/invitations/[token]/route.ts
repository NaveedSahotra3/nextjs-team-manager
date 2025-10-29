import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { invitations, teamMembers, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/invitations/[token]
 * Get invitation details by token
 */
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    // Get invitation with team details
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
      with: {
        team: true,
        inviter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expiresAt)) {
      // Update status to expired if not already
      if (invitation.status === "pending") {
        await db
          .update(invitations)
          .set({ status: "expired" })
          .where(eq(invitations.id, invitation.id));
      }

      return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
    }

    // Check if invitation is already accepted
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 410 }
      );
    }

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          teamName: invitation.team.name,
          teamSlug: invitation.team.slug,
          inviterName: invitation.inviter.name || invitation.inviter.email,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 });
  }
}

/**
 * POST /api/invitations/[token]
 * Accept invitation and join team
 */
export async function POST(_request: Request, { params }: { params: { token: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to accept an invitation" },
        { status: 401 }
      );
    }

    const { token } = params;

    // Get invitation
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
      with: {
        team: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expiresAt)) {
      await db
        .update(invitations)
        .set({ status: "expired" })
        .where(eq(invitations.id, invitation.id));

      return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
    }

    // Check if invitation is already accepted
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 410 }
      );
    }

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify email matches (case-insensitive)
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
        },
        { status: 403 }
      );
    }

    // Check if user is already an active member (exclude removed members)
    const existingMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, invitation.teamId),
        eq(teamMembers.userId, user.id),
        isNull(teamMembers.removedAt)
      ),
    });

    if (existingMembership) {
      return NextResponse.json({ error: "You are already a member of this team" }, { status: 400 });
    }

    // Check if there's an old removed membership record for this user
    const removedMembership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, invitation.teamId), eq(teamMembers.userId, user.id)),
    });

    if (removedMembership?.removedAt) {
      // Delete the old removed record to keep data clean
      await db.delete(teamMembers).where(eq(teamMembers.id, removedMembership.id));
    }

    // Add user to team (fresh membership)
    await db.insert(teamMembers).values({
      teamId: invitation.teamId,
      userId: user.id,
      role: invitation.role,
    });

    // Update invitation status
    await db
      .update(invitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(invitations.id, invitation.id));

    return NextResponse.json(
      {
        message: "Successfully joined the team",
        team: {
          slug: invitation.team.slug,
          name: invitation.team.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
