/**
 * Users Table Schema
 *
 * Enhanced for Auth.js v5 compatibility + Security
 *
 * Security Features:
 * - Email verification tracking
 * - Account status management (active, suspended, deleted)
 * - Soft deletes with deletedAt timestamp
 * - Legal agreement tracking (ToS, Privacy Policy)
 * - Last activity tracking
 * - IP and device tracking for security
 */

import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * User Status Enum
 *
 * - active: Normal user, can login and use the platform
 * - suspended: Temporarily banned, cannot login
 * - deleted: Soft deleted, marked for deletion
 * - locked: Account locked due to security reasons (too many failed logins)
 * - pending: Email verification pending (new accounts)
 */
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "deleted",
  "locked",
  "pending",
]);

/**
 * Users Table
 *
 * Compatible with Auth.js adapter requirements while maintaining custom fields
 */
export const users = pgTable(
  "users",
  {
    // ==================== PRIMARY KEY ====================
    id: uuid("id").defaultRandom().primaryKey(),

    // ==================== AUTH.JS REQUIRED FIELDS ====================
    // These fields are required by Auth.js adapter
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { withTimezone: true }), // Auth.js uses this
    name: text("name"), // Auth.js uses this (optional)
    image: text("image"), // Auth.js uses this (optional, profile picture URL)

    // ==================== EXTENDED PERSONAL INFO ====================
    // These are custom fields for more detailed user profiles
    firstName: text("first_name"), // Made optional for Auth.js compatibility
    middleName: text("middle_name"),
    lastName: text("last_name"), // Made optional for Auth.js compatibility
    phoneNumber: text("phone_number"),

    // ==================== LEGAL AGREEMENTS ====================
    agreedToTos: boolean("agreed_to_tos").notNull().default(false),
    tosAgreedAt: timestamp("tos_agreed_at", { withTimezone: true }),
    agreedToPrivacy: boolean("agreed_to_privacy").notNull().default(false),
    privacyAgreedAt: timestamp("privacy_agreed_at", { withTimezone: true }),

    // ==================== ACCOUNT STATUS & SECURITY ====================
    status: userStatusEnum("status").notNull().default("pending"),

    // Account lockout (security)
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastFailedLoginAt: timestamp("last_failed_login_at", {
      withTimezone: true,
    }),

    // Activity tracking
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    lastLoginIp: text("last_login_ip"),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),

    // ==================== PREFERENCES ====================
    // User preferences (can be extended)
    locale: text("locale").default("en"), // i18n support
    timezone: text("timezone").default("UTC"),

    // ==================== METADATA ====================
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft delete
  },
  (table) => ({
    // ==================== INDEXES ====================
    // Performance indexes for common queries
    emailIdx: index("users_email_idx").on(table.email),
    statusIdx: index("users_status_idx").on(table.status),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
    deletedAtIdx: index("users_deleted_at_idx").on(table.deletedAt),
    lastLoginAtIdx: index("users_last_login_at_idx").on(table.lastLoginAt),

    // Composite index for common query pattern (active users)
    activeUsersIdx: index("users_active_idx").on(table.deletedAt, table.status),

    // Index for email verification lookups
    emailVerifiedIdx: index("users_email_verified_idx").on(table.emailVerified),
  }),
);

/**
 * User Type (for SELECT queries)
 */
export type User = typeof users.$inferSelect;

/**
 * Insert User Type (for INSERT queries)
 */
export type InsertUser = typeof users.$inferInsert;

/**
 * Public User Type (safe to expose to frontend)
 * Excludes sensitive fields
 */
export type PublicUser = Pick<
  User,
  | "id"
  | "email"
  | "name"
  | "image"
  | "firstName"
  | "lastName"
  | "status"
  | "createdAt"
>;
