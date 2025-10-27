import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { env } from "@/env";

// Create transporter with proper typing
const transporter: Transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

interface SendInvitationEmailParams {
  to: string;
  teamName: string;
  inviterName: string;
  invitationUrl: string;
}

/**
 * Send team invitation email
 * @param params - Email parameters
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<void> {
  const { to, teamName, inviterName, invitationUrl } = params;

  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject: `You've been invited to join ${teamName}`,
    html: getInvitationEmailTemplate({
      teamName,
      inviterName,
      invitationUrl,
    }),
    text: getInvitationEmailText({
      teamName,
      inviterName,
      invitationUrl,
    }),
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
