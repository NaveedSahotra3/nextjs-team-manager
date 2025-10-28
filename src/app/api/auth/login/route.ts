import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { sanitizeEmail, verifyPassword } from "@/lib/security";
import { signInSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    // Validate input
    const validation = signInSchema.safeParse(body);
    if (!validation.success) {
      // Format validation errors for better user experience
      const formattedErrors = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          message: "Please check the following fields:",
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const sanitizedEmail = sanitizeEmail(email);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, sanitizedEmail),
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Check if user has a password (might be OAuth only user)
    if (!user.password) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message:
            "This account uses a different sign-in method. Please try signing in with your social provider.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Return user data (without password)
    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: "An error occurred during login. Please try again later.",
      },
      { status: 500 }
    );
  }
}
