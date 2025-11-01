// eslint-disable-next-line import/no-named-as-default-member
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";

import { env } from "@/env";

// Initialize Resend if API key is available
const resend = process.env["RESEND_API_KEY"] ? new Resend(process.env["RESEND_API_KEY"]) : null;

// Create nodemailer transporter with proper typing
const transporter: Transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  // Increase timeout for Vercel serverless
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendInvitationEmailParams {
  to: string;
  teamName: string;
  inviterName: string;
  invitationUrl: string;
}

interface BatchEmailParams {
  emails: Array<{
    to: string;
    teamName: string;
    inviterName: string;
    invitationUrl: string;
  }>;
}

/**
 * Send a generic email
 * @param params - Email parameters
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, html, text } = params;

  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    text: text || "",
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send team invitation email
 * @param params - Email parameters
 */
export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<void> {
  const { to, teamName, inviterName, invitationUrl } = params;

  const subject = `You've been invited to join ${teamName}`;
  const html = getInvitationEmailTemplate({
    teamName,
    inviterName,
    invitationUrl,
  });
  const text = getInvitationEmailText({
    teamName,
    inviterName,
    invitationUrl,
  });

  // Try Resend first (better for Vercel)
  if (resend) {
    try {
      // Use Resend's onboarding email for testing (or verified domain in production)
      const fromEmail = process.env["RESEND_FROM_EMAIL"] ?? "onboarding@resend.dev";

      await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      });
      return;
    } catch (error) {
      // Log error but continue to fallback
      if (error instanceof Error) {
        throw new Error(`Resend and SMTP both failed. Last error: ${error.message}`);
      }
      // Fall through to nodemailer
    }
  }

  // Fallback to nodemailer
  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    text,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * HTML email template for team invitation
 */
function getInvitationEmailTemplate(params: {
  teamName: string;
  inviterName: string;
  invitationUrl: string;
}): string {
  const { teamName, inviterName, invitationUrl } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #2563eb; margin-bottom: 20px;">You're Invited!</h1>
        
        <p style="font-size: 16px; margin-bottom: 15px;">
          <strong>${inviterName}</strong> has invited you to join the team 
          <strong>${teamName}</strong>.
        </p>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Click the button below to accept the invitation and join the team:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; color: #2563eb; word-break: break-all;">
          ${invitationUrl}
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999;">
          This invitation will expire in 7 days. If you didn't expect this invitation, 
          you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Plain text email template for team invitation
 */
function getInvitationEmailText(params: {
  teamName: string;
  inviterName: string;
  invitationUrl: string;
}): string {
  const { teamName, inviterName, invitationUrl } = params;

  return `
You're Invited!

${inviterName} has invited you to join the team ${teamName}.

Accept the invitation by visiting this link:
${invitationUrl}

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}

/**
 * Send batch invitation emails using Resend's batch API
 * Processes up to 100 emails per batch (Resend's limit)
 * @param params - Batch email parameters
 * @returns Array of results with success/failure status for each email
 */
export async function sendBatchInvitationEmails(
  params: BatchEmailParams
): Promise<Array<{ email: string; success: boolean; error?: string }>> {
  const { emails } = params;
  const results: Array<{ email: string; success: boolean; error?: string }> = [];

  // If using Resend and batch size is reasonable, use batch API
  if (resend && emails.length <= 100) {
    try {
      const fromEmail = process.env["RESEND_FROM_EMAIL"] ?? "onboarding@resend.dev";

      const batchEmails = emails.map((emailData) => ({
        from: fromEmail,
        to: emailData.to,
        subject: `You've been invited to join ${emailData.teamName}`,
        html: getInvitationEmailTemplate({
          teamName: emailData.teamName,
          inviterName: emailData.inviterName,
          invitationUrl: emailData.invitationUrl,
        }),
        text: getInvitationEmailText({
          teamName: emailData.teamName,
          inviterName: emailData.inviterName,
          invitationUrl: emailData.invitationUrl,
        }),
      }));

      const response = await resend.batch.send(batchEmails);

      // Mark all as success if batch succeeded
      if (response.data) {
        emails.forEach((emailData) => {
          results.push({ email: emailData.to, success: true });
        });
      } else {
        // If batch failed, mark all as failed
        emails.forEach((emailData) => {
          results.push({
            email: emailData.to,
            success: false,
            error: "Batch send failed",
          });
        });
      }

      return results;
    } catch (error) {
      // If Resend batch fails, fall through to individual sending
      console.error("Resend batch failed:", error);
    }
  }

  // Fallback: Send emails one by one (for >100 emails or if Resend unavailable)
  for (const emailData of emails) {
    try {
      await sendInvitationEmail({
        to: emailData.to,
        teamName: emailData.teamName,
        inviterName: emailData.inviterName,
        invitationUrl: emailData.invitationUrl,
      });
      results.push({ email: emailData.to, success: true });
    } catch (error) {
      results.push({
        email: emailData.to,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Verify email transporter connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Email connection failed:", error);
    return false;
  }
}
