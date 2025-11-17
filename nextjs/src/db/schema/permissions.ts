/**
 * Permissions Table Schema
 *
 * Defines granular permissions for RBAC
 *
 * Permission naming convention:
 * - resource:action (e.g., "users:read", "posts:create", "settings:update")
 *
 * Categories:
 * - users: User management (users:create, users:read, users:update, users:delete)
 * - posts: Content management
 * - comments: Comment moderation
 * - settings: System settings
 * - admin: Administrative functions
 */

import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Permissions Table
 */
export const permissions = pgTable(
  "permissions",
  {
    // Primary key
    id: uuid("id").defaultRandom().primaryKey(),

    // Permission identification
    name: text("name").notNull().unique(), // e.g., "users:create"
    resource: text("resource").notNull(), // e.g., "users", "posts", "comments"
    action: text("action").notNull(), // e.g., "create", "read", "update", "delete"
    description: text("description"), // Human-readable description

    // System permission (cannot be deleted)
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
    nameIdx: index("permissions_name_idx").on(table.name),
    resourceIdx: index("permissions_resource_idx").on(table.resource),
    resourceActionIdx: index("permissions_resource_action_idx").on(
      table.resource,
      table.action,
    ),
    isActiveIdx: index("permissions_is_active_idx").on(table.isActive),
  }),
);

/**
 * Permission Type (for SELECT queries)
 */
export type Permission = typeof permissions.$inferSelect;

/**
 * Insert Permission Type (for INSERT queries)
 */
export type InsertPermission = typeof permissions.$inferInsert;
