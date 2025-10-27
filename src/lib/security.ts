// eslint-disable-next-line import/no-named-as-default-member
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 * @param length - Length of the token (default: 32)
 * @returns Secure random token
 */
export function generateToken(length: number = 32): string {
  return nanoid(length);
}

/**
 * Generate an invitation token (URL-safe)
 * @returns URL-safe invitation token
 */
export function generateInvitationToken(): string {
  return nanoid(48);
}

/**
 * Create an expiration date for invitations
 * @param days - Number of days until expiration (default: 7)
 * @returns Date object representing expiration
 */
export function createExpirationDate(days: number = 7): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
}

/**
 * Check if a date has expired
 * @param date - Date to check
 * @returns True if date has expired
 */
export function isExpired(date: Date): boolean {
  return new Date() > date;
}

/**
 * Sanitize email to lowercase and trim
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }

  return {
    isValid: true,
    message: "Password is strong",
  };
}
