/**
 * Auth.js Accounts Table Schema
 *
 * Stores OAuth provider connections and credentials
 *
 * This table links users to their authentication providers (GitHub, Google, etc.)
 * One user can have multiple accounts (e.g., both GitHub and Google)
 */

import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Accounts Table (Auth.js Adapter)
 *
 * Required by Auth.js Drizzle adapter
 */
export const accounts = pgTable(
  "accounts",
  {
    // Foreign key to users table
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Provider information
    type: text("type").notNull(), // "oauth", "oidc", "email", "webauthn"
    provider: text("provider").notNull(), // "github", "google", "resend"
    providerAccountId: text("provider_account_id").notNull(), // Provider's user ID

    // OAuth tokens
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"), // Unix timestamp (seconds)
    token_type: text("token_type"), // "Bearer"
    scope: text("scope"), // OAuth scopes granted
    id_token: text("id_token"), // OIDC ID token
    session_state: text("session_state"), // OAuth session state

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Composite primary key (provider + providerAccountId)
    // This ensures one account per provider per user
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),

    // Index for efficient user lookups
    userIdIdx: index("accounts_user_id_idx").on(table.userId),

    // Index for token expiry cleanup
    expiresAtIdx: index("accounts_expires_at_idx").on(table.expires_at),
  }),
);

/**
 * Account Type (for SELECT queries)
 */
export type Account = typeof accounts.$inferSelect;

/**
 * Insert Account Type (for INSERT queries)
 */
export type InsertAccount = typeof accounts.$inferInsert;
