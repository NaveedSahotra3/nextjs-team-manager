import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/test-email
 * Test email configuration (sends test email to authenticated user)
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to test email functionality" },
        { status: 401 }
      );
    }

    // Test sending a simple email to the authenticated user
    await sendEmail({
      to: session.user.email,
      subject: "Test Email - Team Manager",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration Test Successful!</h2>
          <p>Your email system is working correctly.</p>
          <p><strong>Package Version:</strong> nodemailer@^6.10.1</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            This is a test email sent from your Team Manager application.
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Test email sent successfully to ${session.user.email}`,
        nodemailerVersion: "nodemailer@^6.10.1",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Email test failed",
        message: error instanceof Error ? error.message : "Unknown error",
        details: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      },
      { status: 500 }
    );
  }
}
