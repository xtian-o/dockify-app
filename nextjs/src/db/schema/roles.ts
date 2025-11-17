/**
 * Roles Table Schema
 *
 * Defines system roles for RBAC (Role-Based Access Control)
 *
 * Built-in roles:
 * - admin: Full system access
 * - moderator: Content moderation and user management
 * - user: Standard user access
 *
 * Custom roles can be created via admin panel
 */

import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Roles Table
 */
export const roles = pgTable(
  "roles",
  {
    // Primary key
    id: uuid("id").defaultRandom().primaryKey(),

    // Role identification
    name: text("name").notNull().unique(), // e.g., "admin", "moderator", "user"
    slug: text("slug").notNull().unique(), // e.g., "admin", "moderator", "user" (URL-safe)
    description: text("description"), // Human-readable description

    // Role hierarchy (for permission inheritance)
    // Lower number = higher priority (admin = 0, moderator = 1, user = 2)
    priority: integer("priority").notNull().default(999),

    // System role (cannot be deleted)
    isSystem: boolean("is_system").notNull().default(false),

    // Active status
    isActive: boolean("is_active").notNull().default(true),

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
    // Indexes
    slugIdx: index("roles_slug_idx").on(table.slug),
    priorityIdx: index("roles_priority_idx").on(table.priority),
    isActiveIdx: index("roles_is_active_idx").on(table.isActive),
  }),
);

/**
 * Role Type (for SELECT queries)
 */
export type Role = typeof roles.$inferSelect;

/**
 * Insert Role Type (for INSERT queries)
 */
export type InsertRole = typeof roles.$inferInsert;
