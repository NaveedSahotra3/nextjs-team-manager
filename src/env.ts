import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema
   */
  server: {
    // Database
    DATABASE_URL: z.string().url(),

    // NextAuth
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),

    // Email (NodeMailer)
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: z.string().email(),
    SMTP_PASSWORD: z.string().min(1),
    SMTP_FROM: z.string().email(),

    // Node Environment
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  /**
   * Client-side environment variables schema
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  /**
   * Runtime environment variables
   */
  runtimeEnv: {
    // Server
    DATABASE_URL: process.env["DATABASE_URL"],
    NEXTAUTH_SECRET: process.env["NEXTAUTH_SECRET"],
    NEXTAUTH_URL: process.env["NEXTAUTH_URL"],
    SMTP_HOST: process.env["SMTP_HOST"],
    SMTP_PORT: process.env["SMTP_PORT"],
    SMTP_USER: process.env["SMTP_USER"],
    SMTP_PASSWORD: process.env["SMTP_PASSWORD"],
    SMTP_FROM: process.env["SMTP_FROM"],
    NODE_ENV: process.env["NODE_ENV"],

    // Client
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
  },

  /**
   * Skip validation in build mode
   */
  skipValidation: process.env["SKIP_ENV_VALIDATION"] === "true",

  /**
   * Makes it so empty strings are treated as undefined
   */
  emptyStringAsUndefined: true,
});
