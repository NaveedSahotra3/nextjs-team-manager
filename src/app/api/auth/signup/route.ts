import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, sanitizeEmail } from "@/lib/security";
import { signUpSchema } from "@/lib/validations";

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
    const validation = signUpSchema.safeParse(body);
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

    const { name, email, password } = validation.data;
    const sanitizedEmail = sanitizeEmail(email);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: sanitizedEmail,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json({ error: "An error occurred during sign up" }, { status: 500 });
  }
}
