import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { invitations, teamMembers, teams } from "@/db/schema";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/teams/[slug]/invitations/generate-link
 * Generate a shareable invite link for the team
 */
export async function POST(_request: Request, { params }: { params: { slug: string } }) {
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

    // Check if user has admin access (exclude removed members)
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, team.id),
        eq(teamMembers.userId, session.user.id),
        isNull(teamMembers.removedAt)
      ),
    });

    const hasAccess =
      team.ownerId === session.user.id ||
      (membership && (membership.role === "admin" || membership.role === "owner"));

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Only team owners and admins can generate invite links" },
        { status: 403 }
      );
    }

    // Create invitation token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation with a generic email for link-based invites
    const [invitation] = await db
      .insert(invitations)
      .values({
        teamId: team.id,
        email: `link-invite-${token}@placeholder.local`, // Placeholder email for link invites
        role: "member", // Default role for link invites
        invitedBy: session.user.id,
        token,
        status: "pending",
        expiresAt,
      })
      .returning();

    if (!invitation) {
      return NextResponse.json({ error: "Failed to generate invite link" }, { status: 500 });
    }

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXTAUTH_URL}/invitations/${token}`;

    return NextResponse.json(
      {
        invitationUrl,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating invite link:", error);
    return NextResponse.json({ error: "Failed to generate invite link" }, { status: 500 });
  }
}
