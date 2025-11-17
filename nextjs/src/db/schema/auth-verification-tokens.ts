/**
 * Auth.js Verification Tokens Table Schema
 *
 * Stores email verification tokens (OTP codes for magic link authentication)
 *
 * These tokens are used for:
 * - Email magic link authentication
 * - Email verification
 * - Password reset (future)
 *
 * Note: For production, consider storing OTPs in Redis instead of database
 * for better performance and automatic expiry
 */

import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Verification Tokens Table (Auth.js Adapter)
 *
 * Required by Auth.js Drizzle adapter for email provider
 */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    // Email address (identifier)
    identifier: text("identifier").notNull(), // Usually email address

    // Token (hashed)
    token: text("token").notNull(), // 6-digit OTP or secure token

    // Expiry timestamp
    expires: timestamp("expires", { withTimezone: true }).notNull(),

    // Metadata for security tracking
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Composite primary key (identifier + token)
    pk: primaryKey({ columns: [table.identifier, table.token] }),

    // Index for cleanup (delete expired tokens)
    expiresIdx: index("verification_tokens_expires_idx").on(table.expires),

    // Index for identifier lookups
    identifierIdx: index("verification_tokens_identifier_idx").on(
      table.identifier,
    ),
  }),
);

/**
 * Verification Token Type (for SELECT queries)
 */
export type VerificationToken = typeof verificationTokens.$inferSelect;

/**
 * Insert Verification Token Type (for INSERT queries)
 */
export type InsertVerificationToken = typeof verificationTokens.$inferInsert;
