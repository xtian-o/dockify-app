/**
 * Role Permissions Table Schema
 *
 * Many-to-many relationship between roles and permissions
 *
 * This table defines which permissions are granted to each role
 */

import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { permissions } from "./permissions";
import { roles } from "./roles";

/**
 * Role Permissions Join Table
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    // Foreign keys
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    // Metadata
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    grantedBy: uuid("granted_by"), // User ID who granted this permission (optional)
  },
  (table) => ({
    // Composite primary key (role_id + permission_id)
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),

    // Indexes for efficient lookups
    roleIdIdx: index("role_permissions_role_id_idx").on(table.roleId),
    permissionIdIdx: index("role_permissions_permission_id_idx").on(
      table.permissionId,
    ),
  }),
);

/**
 * Role Permission Type (for SELECT queries)
 */
export type RolePermission = typeof rolePermissions.$inferSelect;

/**
 * Insert Role Permission Type (for INSERT queries)
 */
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
