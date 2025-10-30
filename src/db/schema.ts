// src/db/schema.ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, varchar, uuid, pgEnum, index } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["owner", "admin", "member"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "expired"]);
export const headshotStatusEnum = pgEnum("headshot_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

// Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    password: varchar("password", { length: 255 }), // hashed password
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

// Accounts Table (for OAuth providers)
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: timestamp("expires_at", { mode: "date" }),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => ({
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
    providerIdx: index("accounts_provider_idx").on(table.provider, table.providerAccountId),
  })
);

// Sessions Table
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    sessionTokenIdx: index("sessions_session_token_idx").on(table.sessionToken),
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  })
);

// Verification Tokens Table
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    tokenIdx: index("verification_tokens_token_idx").on(table.token),
  })
);

// Teams Table
export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("teams_slug_idx").on(table.slug),
    ownerIdIdx: index("teams_owner_id_idx").on(table.ownerId),
  })
);

// Team Credits Table - Manages credit pool for entire team
export const teamCredits = pgTable(
  "team_credits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" })
      .unique(),
    totalCredits: varchar("total_credits", { length: 255 }).notNull().default("0"), // Total credits purchased
    usedCredits: varchar("used_credits", { length: 255 }).notNull().default("0"), // Credits consumed
    estimatedHeadshotsPerMember: varchar("estimated_headshots_per_member", { length: 255 })
      .notNull()
      .default("20"), // Expected headshots per member
    estimatedMembers: varchar("estimated_members", { length: 255 }).notNull().default("1"), // Number of members
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }), // Stripe customer ID
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }), // Stripe subscription ID (if recurring)
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    teamIdIdx: index("team_credits_team_id_idx").on(table.teamId),
    stripeCustomerIdx: index("team_credits_stripe_customer_idx").on(table.stripeCustomerId),
  })
);

// Member Credits Table - Individual credit allocation per team member
export const memberCredits = pgTable(
  "member_credits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    allocatedCredits: varchar("allocated_credits", { length: 255 }).notNull().default("0"), // Credits allocated to this member
    usedCredits: varchar("used_credits", { length: 255 }).notNull().default("0"), // Credits used by this member
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    teamIdIdx: index("member_credits_team_id_idx").on(table.teamId),
    userIdIdx: index("member_credits_user_id_idx").on(table.userId),
    teamUserIdx: index("member_credits_team_user_idx").on(table.teamId, table.userId),
  })
);

// Headshots Table - Track all headshot generations
export const headshots = pgTable(
  "headshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: headshotStatusEnum("status").notNull().default("pending"),
    inputImages: text("input_images").array(), // Array of uploaded selfie URLs
    outputImages: text("output_images").array(), // Array of generated headshot URLs
    style: varchar("style", { length: 255 }), // Selected style (e.g., "formal business", "casual")
    creditsCost: varchar("credits_cost", { length: 255 }).notNull().default("1"), // Credits deducted for this generation
    errorMessage: text("error_message"), // Error details if failed
    metadata: text("metadata"), // JSON string for additional data
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => ({
    teamIdIdx: index("headshots_team_id_idx").on(table.teamId),
    userIdIdx: index("headshots_user_id_idx").on(table.userId),
    statusIdx: index("headshots_status_idx").on(table.status),
    teamUserIdx: index("headshots_team_user_idx").on(table.teamId, table.userId),
  })
);

// Payments Table - Track all credit purchases and payments
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Who made the payment
    amount: varchar("amount", { length: 255 }).notNull(), // Amount in cents
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    creditsAdded: varchar("credits_added", { length: 255 }).notNull(), // Credits added from this payment
    status: paymentStatusEnum("status").notNull().default("pending"),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
    metadata: text("metadata"), // JSON string for additional data
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => ({
    teamIdIdx: index("payments_team_id_idx").on(table.teamId),
    userIdIdx: index("payments_user_id_idx").on(table.userId),
    statusIdx: index("payments_status_idx").on(table.status),
    stripePaymentIntentIdx: index("payments_stripe_payment_intent_idx").on(
      table.stripePaymentIntentId
    ),
    stripeCheckoutSessionIdx: index("payments_stripe_checkout_session_idx").on(
      table.stripeCheckoutSessionId
    ),
  })
);

// Team Members Table (Junction table for users and teams)
export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
    removedAt: timestamp("removed_at", { mode: "date" }),
    removedBy: uuid("removed_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => ({
    teamIdIdx: index("team_members_team_id_idx").on(table.teamId),
    userIdIdx: index("team_members_user_id_idx").on(table.userId),
    teamUserIdx: index("team_members_team_user_idx").on(table.teamId, table.userId),
  })
);

// Invitations Table
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("member"),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
  },
  (table) => ({
    tokenIdx: index("invitations_token_idx").on(table.token),
    emailIdx: index("invitations_email_idx").on(table.email),
    teamIdIdx: index("invitations_team_id_idx").on(table.teamId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  ownedTeams: many(teams),
  teamMemberships: many(teamMembers),
  sentInvitations: many(invitations),
  memberCredits: many(memberCredits),
  headshots: many(headshots),
  payments: many(payments),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
  invitations: many(invitations),
  credits: one(teamCredits, {
    fields: [teams.id],
    references: [teamCredits.teamId],
  }),
  memberCredits: many(memberCredits),
  headshots: many(headshots),
  payments: many(payments),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  inviter: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamCreditsRelations = relations(teamCredits, ({ one }) => ({
  team: one(teams, {
    fields: [teamCredits.teamId],
    references: [teams.id],
  }),
}));

export const memberCreditsRelations = relations(memberCredits, ({ one }) => ({
  team: one(teams, {
    fields: [memberCredits.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [memberCredits.userId],
    references: [users.id],
  }),
}));

export const headshotsRelations = relations(headshots, ({ one }) => ({
  team: one(teams, {
    fields: [headshots.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [headshots.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  team: one(teams, {
    fields: [payments.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamCredit = typeof teamCredits.$inferSelect;
export type NewTeamCredit = typeof teamCredits.$inferInsert;
export type MemberCredit = typeof memberCredits.$inferSelect;
export type NewMemberCredit = typeof memberCredits.$inferInsert;
export type Headshot = typeof headshots.$inferSelect;
export type NewHeadshot = typeof headshots.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Role = (typeof roleEnum.enumValues)[number];
export type InvitationStatus = (typeof invitationStatusEnum.enumValues)[number];
export type HeadshotStatus = (typeof headshotStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
