import { z } from "zod";

// Auth Schemas
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must not exceed 255 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

// Team Schemas
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(255, "Team name must not exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Team name can only contain letters, numbers, spaces, and hyphens"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(255, "Slug must not exceed 255 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .regex(/^[a-z0-9]/, "Slug must start with a letter or number")
    .regex(/[a-z0-9]$/, "Slug must end with a letter or number"),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(255, "Team name must not exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Team name can only contain letters, numbers, spaces, and hyphens")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
});

// Invitation Schemas
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .transform((val) => val.toLowerCase().trim()),
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be either 'admin' or 'member'" }),
  }),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// Team Member Schemas
export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
  role: z.enum(["owner", "admin", "member"], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

export const removeMemberSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
});

// UUID Param Schema
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
