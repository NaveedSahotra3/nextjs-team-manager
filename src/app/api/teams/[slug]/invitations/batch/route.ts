import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/db";
import { invitations, teamMembers, teams, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { sendBatchInvitationEmails } from "@/lib/email";

interface BatchInviteRequest {
  emails: string[];
  role: "admin" | "member" | "viewer";
}

/**
 * POST /api/teams/[slug]/invitations/batch
 * Send batch invitations to multiple email addresses
 */
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    const body = (await request.json()) as BatchInviteRequest;
    const { emails, role = "member" } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Emails array is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: "Invalid email addresses", invalidEmails },
        { status: 400 }
      );
    }

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
        { error: "Only team owners and admins can invite members" },
        { status: 403 }
      );
    }

    // Get inviter name
    const inviter = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    const inviterName = inviter?.name ?? "A team member";

    // Process each email
    const results: Array<{
      email: string;
      success: boolean;
      error?: string;
      status?: string;
    }> = [];

    const emailsToSend: Array<{
      to: string;
      teamName: string;
      inviterName: string;
      invitationUrl: string;
    }> = [];

    // First, create all invitations in the database
    for (const email of emails) {
      const lowerEmail = email.toLowerCase().trim();

      try {
        // Check if user already exists and is a team member
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, lowerEmail),
        });

        if (existingUser) {
          const existingMember = await db.query.teamMembers.findFirst({
            where: and(
              eq(teamMembers.teamId, team.id),
              eq(teamMembers.userId, existingUser.id),
              isNull(teamMembers.removedAt)
            ),
          });

          if (existingMember) {
            results.push({
              email: lowerEmail,
              success: false,
              error: "User is already a team member",
              status: "already_member",
            });
            continue;
          }
        }

        // Check if invitation already exists and is pending
        const existingInvitation = await db.query.invitations.findFirst({
          where: and(eq(invitations.teamId, team.id), eq(invitations.email, lowerEmail)),
        });

        if (existingInvitation?.status === "pending") {
          results.push({
            email: lowerEmail,
            success: false,
            error: "Invitation already sent",
            status: "already_invited",
          });
          continue;
        }

        // Create invitation
        const token = nanoid(32);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        const [invitation] = await db
          .insert(invitations)
          .values({
            teamId: team.id,
            email: lowerEmail,
            role,
            invitedBy: session.user.id,
            token,
            status: "pending",
            expiresAt,
          })
          .returning();

        if (invitation) {
          const invitationUrl = `${process.env.NEXTAUTH_URL}/invitations/${token}`;
          emailsToSend.push({
            to: lowerEmail,
            teamName: team.name,
            inviterName,
            invitationUrl,
          });

          results.push({
            email: lowerEmail,
            success: true,
            status: "invitation_created",
          });
        }
      } catch (error) {
        console.error(`Error creating invitation for ${lowerEmail}:`, error);
        results.push({
          email: lowerEmail,
          success: false,
          error: "Failed to create invitation",
          status: "error",
        });
      }
    }

    // Send emails in batches using Resend batch API
    if (emailsToSend.length > 0) {
      try {
        const emailResults = await sendBatchInvitationEmails({ emails: emailsToSend });

        // Update results with email sending status
        emailResults.forEach((emailResult) => {
          const resultIndex = results.findIndex((r) => r.email === emailResult.email);
          if (resultIndex !== -1) {
            if (!emailResult.success) {
              results[resultIndex] = {
                ...results[resultIndex],
                success: false,
                error: `Invitation created but email failed: ${emailResult.error}`,
                status: "email_failed",
              };
            } else {
              results[resultIndex] = {
                ...results[resultIndex],
                status: "sent",
              };
            }
          }
        });
      } catch (error) {
        console.error("Batch email sending failed:", error);
        // Mark all emails as failed
        emailsToSend.forEach((emailData) => {
          const resultIndex = results.findIndex((r) => r.email === emailData.to);
          if (resultIndex !== -1) {
            results[resultIndex] = {
              ...results[resultIndex],
              error: "Email sending failed",
              status: "email_failed",
            };
          }
        });
      }
    }

    // Calculate summary
    const summary = {
      total: emails.length,
      successful: results.filter((r) => r.success && r.status === "sent").length,
      failed: results.filter((r) => !r.success).length,
      alreadyMembers: results.filter((r) => r.status === "already_member").length,
      alreadyInvited: results.filter((r) => r.status === "already_invited").length,
      emailFailed: results.filter((r) => r.status === "email_failed").length,
    };

    return NextResponse.json(
      {
        summary,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending batch invitations:", error);
    return NextResponse.json({ error: "Failed to send batch invitations" }, { status: 500 });
  }
}
