/**
 * User Roles Table Schema
 *
 * Many-to-many relationship between users and roles
 *
 * Users can have multiple roles (e.g., both "user" and "moderator")
 */

import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { users } from "./users";

/**
 * User Roles Join Table
 */
export const userRoles = pgTable(
  "user_roles",
  {
    // Foreign keys
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    // Metadata
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedBy: uuid("assigned_by"), // User ID who assigned this role (optional)
    expiresAt: timestamp("expires_at", { withTimezone: true }), // Optional role expiry
  },
  (table) => ({
    // Composite primary key (user_id + role_id)
    pk: primaryKey({ columns: [table.userId, table.roleId] }),

    // Indexes for efficient lookups
    userIdIdx: index("user_roles_user_id_idx").on(table.userId),
    roleIdIdx: index("user_roles_role_id_idx").on(table.roleId),
    expiresAtIdx: index("user_roles_expires_at_idx").on(table.expiresAt),
  }),
);

/**
 * User Role Type (for SELECT queries)
 */
export type UserRole = typeof userRoles.$inferSelect;

/**
 * Insert User Role Type (for INSERT queries)
 */
export type InsertUserRole = typeof userRoles.$inferInsert;
