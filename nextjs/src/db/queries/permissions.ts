/**
 * Permission Database Queries
 *
 * CRUD operations for permissions and permission management
 */

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type { InsertPermission } from "@/db/schema";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";

/**
 * Get All Permissions
 *
 * Returns all permissions grouped by resource
 *
 * @param includeInactive - Include inactive permissions (default: false)
 * @returns Array of permissions
 */
export async function getAllPermissions(includeInactive = false) {
  const query = db
    .select()
    .from(permissions)
    .orderBy(permissions.resource, permissions.action);

  if (!includeInactive) {
    return await query.where(eq(permissions.isActive, true));
  }

  return await query;
}

/**
 * Get Permission by ID
 *
 * @param permissionId - Permission UUID
 * @returns Permission or null
 */
export async function getPermissionById(permissionId: string) {
  const [permission] = await db
    .select()
    .from(permissions)
    .where(eq(permissions.id, permissionId))
    .limit(1);

  return permission || null;
}

/**
 * Get Permission by Name
 *
 * @param name - Permission name (e.g., "users:create")
 * @returns Permission or null
 *
 * @example
 * ```ts
 * const permission = await getPermissionByName("users:create");
 * ```
 */
export async function getPermissionByName(name: string) {
  const [permission] = await db
    .select()
    .from(permissions)
    .where(eq(permissions.name, name))
    .limit(1);

  return permission || null;
}

/**
 * Get Permissions by Resource
 *
 * Returns all permissions for a specific resource
 *
 * @param resource - Resource name (e.g., "users", "posts")
 * @returns Array of permissions
 *
 * @example
 * ```ts
 * const userPermissions = await getPermissionsByResource("users");
 * // Returns: ["users:create", "users:read", "users:update", "users:delete"]
 * ```
 */
export async function getPermissionsByResource(resource: string) {
  return await db
    .select()
    .from(permissions)
    .where(
      and(eq(permissions.resource, resource), eq(permissions.isActive, true)),
    )
    .orderBy(permissions.action);
}

/**
 * Create Permission
 *
 * Creates a new permission (non-system)
 *
 * @param data - Permission data
 * @returns Created permission
 *
 * @example
 * ```ts
 * const permission = await createPermission({
 *   name: "posts:publish",
 *   resource: "posts",
 *   action: "publish",
 *   description: "Publish posts to public",
 * });
 * ```
 */
export async function createPermission(data: InsertPermission) {
  const [permission] = await db.insert(permissions).values(data).returning();
  return permission;
}

/**
 * Update Permission
 *
 * Updates permission details
 *
 * @param permissionId - Permission UUID
 * @param data - Partial permission data
 * @returns Updated permission or null
 */
export async function updatePermission(
  permissionId: string,
  data: Partial<Omit<InsertPermission, "id">>,
) {
  const [permission] = await db
    .update(permissions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(permissions.id, permissionId))
    .returning();

  return permission || null;
}

/**
 * Delete Permission
 *
 * Deletes a permission (only non-system permissions can be deleted)
 *
 * @param permissionId - Permission UUID
 * @returns Boolean indicating success
 *
 * @throws Error if attempting to delete a system permission
 */
export async function deletePermission(permissionId: string): Promise<boolean> {
  const permission = await getPermissionById(permissionId);

  if (!permission) {
    throw new Error("Permission not found");
  }

  if (permission.isSystem) {
    throw new Error("Cannot delete system permission");
  }

  await db.delete(permissions).where(eq(permissions.id, permissionId));
  return true;
}

/**
 * Get Role Permissions
 *
 * Returns all permissions for a specific role
 *
 * @param roleId - Role UUID
 * @returns Array of permissions
 */
export async function getRolePermissions(roleId: string) {
  const results = await db
    .select({
      permission: permissions,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  return results.map((r) => r.permission);
}

/**
 * Get User Permissions
 *
 * Returns all permissions a user has (aggregated from all their roles)
 * This is the most important function for authorization checks!
 *
 * @param userId - User UUID
 * @returns Array of unique permissions
 *
 * @example
 * ```ts
 * const permissions = await getUserPermissions("user-id");
 * // Returns: [{ name: "users:read", resource: "users", action: "read", ... }]
 * ```
 */
export async function getUserPermissions(userId: string) {
  // Get all user's roles (non-expired)
  const now = new Date();

  const results = await db
    .selectDistinct({
      permission: permissions,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(permissions.isActive, true),
        // Only non-expired roles
        sql`(${userRoles.expiresAt} IS NULL OR ${userRoles.expiresAt} > ${now})`,
      ),
    );

  return results.map((r) => r.permission);
}

/**
 * Check if User has Permission
 *
 * Quick boolean check if user has a specific permission
 * This checks across ALL user's roles
 *
 * @param userId - User UUID
 * @param permissionName - Permission name (e.g., "users:create")
 * @returns Boolean
 *
 * @example
 * ```ts
 * const canCreateUsers = await userHasPermission("user-id", "users:create");
 * if (canCreateUsers) {
 *   // Allow user to create users
 * }
 * ```
 */
export async function userHasPermission(
  userId: string,
  permissionName: string,
): Promise<boolean> {
  const permission = await getPermissionByName(permissionName);
  if (!permission) return false;

  const now = new Date();

  const [result] = await db
    .select({ exists: sql<number>`1` })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(rolePermissions.permissionId, permission.id),
        // Only non-expired roles
        sql`(${userRoles.expiresAt} IS NULL OR ${userRoles.expiresAt} > ${now})`,
      ),
    )
    .limit(1);

  return !!result;
}

/**
 * Check if User has Any Permission
 *
 * Checks if user has at least one of the specified permissions
 *
 * @param userId - User UUID
 * @param permissionNames - Array of permission names
 * @returns Boolean
 *
 * @example
 * ```ts
 * const canManageUsers = await userHasAnyPermission("user-id", [
 *   "users:create",
 *   "users:update",
 *   "users:delete"
 * ]);
 * ```
 */
export async function userHasAnyPermission(
  userId: string,
  permissionNames: string[],
): Promise<boolean> {
  if (permissionNames.length === 0) return false;

  const perms = await Promise.all(
    permissionNames.map((name) => getPermissionByName(name)),
  );

  const validPerms = perms.filter((p) => p !== null);
  if (validPerms.length === 0) return false;

  const permIds = validPerms.map((p) => p?.id);
  const now = new Date();

  const [result] = await db
    .select({ exists: sql<number>`1` })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .where(
      and(
        eq(userRoles.userId, userId),
        inArray(rolePermissions.permissionId, permIds),
        // Only non-expired roles
        sql`(${userRoles.expiresAt} IS NULL OR ${userRoles.expiresAt} > ${now})`,
      ),
    )
    .limit(1);

  return !!result;
}

/**
 * Check if User has All Permissions
 *
 * Checks if user has ALL of the specified permissions
 *
 * @param userId - User UUID
 * @param permissionNames - Array of permission names
 * @returns Boolean
 *
 * @example
 * ```ts
 * const canFullyManageUsers = await userHasAllPermissions("user-id", [
 *   "users:create",
 *   "users:read",
 *   "users:update",
 *   "users:delete"
 * ]);
 * ```
 */
export async function userHasAllPermissions(
  userId: string,
  permissionNames: string[],
): Promise<boolean> {
  if (permissionNames.length === 0) return true;

  const results = await Promise.all(
    permissionNames.map((name) => userHasPermission(userId, name)),
  );

  return results.every((has) => has);
}

/**
 * Grant Permission to Role
 *
 * Adds a permission to a role
 *
 * @param roleId - Role UUID
 * @param permissionId - Permission UUID
 * @param grantedBy - User UUID who is granting (optional)
 * @returns Role permission assignment
 */
export async function grantPermissionToRole(
  roleId: string,
  permissionId: string,
  grantedBy?: string,
) {
  // Check if already granted
  const [existing] = await db
    .select()
    .from(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId),
      ),
    )
    .limit(1);

  if (existing) return existing;

  const [assignment] = await db
    .insert(rolePermissions)
    .values({
      roleId,
      permissionId,
      grantedBy,
    })
    .returning();

  return assignment;
}

/**
 * Revoke Permission from Role
 *
 * Removes a permission from a role
 *
 * @param roleId - Role UUID
 * @param permissionId - Permission UUID
 * @returns Boolean indicating success
 */
export async function revokePermissionFromRole(
  roleId: string,
  permissionId: string,
): Promise<boolean> {
  await db
    .delete(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId),
      ),
    );

  return true;
}

/**
 * Sync Role Permissions
 *
 * Replaces all role permissions with a new set
 * Useful for bulk updates
 *
 * @param roleId - Role UUID
 * @param permissionIds - Array of permission UUIDs
 * @param grantedBy - User UUID who is syncing (optional)
 * @returns Array of role permission assignments
 */
export async function syncRolePermissions(
  roleId: string,
  permissionIds: string[],
  grantedBy?: string,
) {
  // Delete existing permissions
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

  // Insert new permissions
  if (permissionIds.length === 0) return [];

  const values = permissionIds.map((permissionId) => ({
    roleId,
    permissionId,
    grantedBy,
  }));

  return await db.insert(rolePermissions).values(values).returning();
}
