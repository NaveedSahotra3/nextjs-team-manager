import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { teams, teamMembers, invitations, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";
import { inviteMemberSchema } from "@/lib/validations";

/**
 * GET /api/teams/[slug]/invitations
 * Get all pending invitations for a team
 */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;

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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all pending invitations
    const pendingInvitations = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
        inviter: {
          name: users.name,
          email: users.email,
        },
      })
      .from(invitations)
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .where(eq(invitations.teamId, team.id));

    return NextResponse.json({ invitations: pendingInvitations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}

/**
 * POST /api/teams/[slug]/invitations
 * Send invitation to a new member
 */
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    const body = await request.json();
    const validatedData = inviteMemberSchema.parse(body);

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
        { error: "Only team owners and admins can invite members" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      const existingMembership = await db.query.teamMembers.findFirst({
        where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, existingUser.id)),
      });

      if (existingMembership) {
        return NextResponse.json({ error: "User is already a team member" }, { status: 400 });
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.teamId, team.id),
        eq(invitations.email, validatedData.email),
        eq(invitations.status, "pending")
      ),
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    // Create invitation token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation
    const [invitation] = await db
      .insert(invitations)
      .values({
        teamId: team.id,
        email: validatedData.email,
        role: validatedData.role,
        invitedBy: session.user.id,
        token,
        status: "pending",
        expiresAt,
      })
      .returning();

    // Send invitation email
    const invitationUrl = `${process.env.NEXTAUTH_URL}/invitations/${token}`;

    try {
      await sendInvitationEmail({
        to: validatedData.email,
        teamName: team.name,
        inviterName: session.user.name || session.user.email || "A team member",
        invitationUrl,
      });
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Delete the invitation if email fails
      if (invitation) {
        await db.delete(invitations).where(eq(invitations.id, invitation.id));
      }
      return NextResponse.json({ error: "Failed to send invitation email" }, { status: 500 });
    }

    if (!invitation) {
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
    }

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
        },
        message: "Invitation sent successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data", details: error }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
