/**
 * Role Database Queries
 *
 * CRUD operations for roles and role management
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import type { InsertRole } from "@/db/schema";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";

/**
 * Get All Roles
 *
 * Returns all roles ordered by priority (admin first)
 *
 * @param includeInactive - Include inactive roles (default: false)
 * @returns Array of roles
 */
export async function getAllRoles(includeInactive = false) {
  const query = db.select().from(roles).orderBy(roles.priority);

  if (!includeInactive) {
    return await query.where(eq(roles.isActive, true));
  }

  return await query;
}

/**
 * Get Role by ID
 *
 * @param roleId - Role UUID
 * @returns Role or null
 */
export async function getRoleById(roleId: string) {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);
  return role || null;
}

/**
 * Get Role by Slug
 *
 * @param slug - Role slug (e.g., "admin", "moderator", "user")
 * @returns Role or null
 *
 * @example
 * ```ts
 * const adminRole = await getRoleBySlug("admin");
 * ```
 */
export async function getRoleBySlug(slug: string) {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.slug, slug))
    .limit(1);
  return role || null;
}

/**
 * Get Role with Permissions
 *
 * Returns role with all its permissions
 *
 * @param roleId - Role UUID
 * @returns Role with permissions or null
 */
export async function getRoleWithPermissions(roleId: string) {
  const role = await getRoleById(roleId);
  if (!role) return null;

  const rolePerms = await db
    .select({
      permission: permissions,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  return {
    ...role,
    permissions: rolePerms.map((rp) => rp.permission),
  };
}

/**
 * Create Role
 *
 * Creates a new role (non-system)
 *
 * @param data - Role data
 * @returns Created role
 *
 * @example
 * ```ts
 * const customRole = await createRole({
 *   name: "Content Creator",
 *   slug: "content-creator",
 *   description: "Can create and edit content",
 *   priority: 3,
 * });
 * ```
 */
export async function createRole(data: InsertRole) {
  const [role] = await db.insert(roles).values(data).returning();
  return role;
}

/**
 * Update Role
 *
 * Updates role details (system roles cannot be deleted, but can be updated)
 *
 * @param roleId - Role UUID
 * @param data - Partial role data
 * @returns Updated role or null
 */
export async function updateRole(
  roleId: string,
  data: Partial<Omit<InsertRole, "id">>,
) {
  const [role] = await db
    .update(roles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(roles.id, roleId))
    .returning();

  return role || null;
}

/**
 * Delete Role
 *
 * Deletes a role (only non-system roles can be deleted)
 *
 * @param roleId - Role UUID
 * @returns Boolean indicating success
 *
 * @throws Error if attempting to delete a system role
 */
export async function deleteRole(roleId: string): Promise<boolean> {
  const role = await getRoleById(roleId);

  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystem) {
    throw new Error("Cannot delete system role");
  }

  await db.delete(roles).where(eq(roles.id, roleId));
  return true;
}

/**
 * Get User Roles
 *
 * Returns all roles assigned to a user (including expired roles if requested)
 *
 * @param userId - User UUID
 * @param includeExpired - Include expired roles (default: false)
 * @returns Array of roles with assignment metadata
 *
 * @example
 * ```ts
 * const userRoles = await getUserRoles("user-id");
 * // Returns: [{ role: {...}, assignedAt: Date, expiresAt: Date | null }]
 * ```
 */
export async function getUserRoles(userId: string, includeExpired = false) {
  const query = db
    .select({
      role: roles,
      assignedAt: userRoles.assignedAt,
      expiresAt: userRoles.expiresAt,
      assignedBy: userRoles.assignedBy,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))
    .orderBy(roles.priority);

  const results = await query;

  if (!includeExpired) {
    const now = new Date();
    return results.filter((r) => !r.expiresAt || r.expiresAt > now);
  }

  return results;
}

/**
 * Check if User has Role
 *
 * Quick boolean check if user has a specific role
 *
 * @param userId - User UUID
 * @param roleSlug - Role slug (e.g., "admin")
 * @returns Boolean
 *
 * @example
 * ```ts
 * const isAdmin = await userHasRole("user-id", "admin");
 * ```
 */
export async function userHasRole(
  userId: string,
  roleSlug: string,
): Promise<boolean> {
  const role = await getRoleBySlug(roleSlug);
  if (!role) return false;

  const [assignment] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
    .limit(1);

  if (!assignment) return false;

  // Check if role is expired
  if (assignment.expiresAt && assignment.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Assign Role to User
 *
 * Assigns a role to a user with optional expiry
 *
 * @param userId - User UUID
 * @param roleId - Role UUID
 * @param assignedBy - User UUID who is assigning the role (optional)
 * @param expiresAt - Expiry date (optional)
 * @returns User role assignment
 *
 * @example
 * ```ts
 * await assignRoleToUser("user-id", "role-id", "admin-id");
 *
 * // With expiry (temporary role)
 * const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
 * await assignRoleToUser("user-id", "role-id", "admin-id", expiryDate);
 * ```
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  assignedBy?: string,
  expiresAt?: Date,
) {
  // Check if role is already assigned
  const [existing] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
    .limit(1);

  if (existing) {
    // Update expiry if provided
    if (expiresAt) {
      const [updated] = await db
        .update(userRoles)
        .set({ expiresAt })
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
        .returning();
      return updated;
    }
    return existing;
  }

  // Create new assignment
  const [assignment] = await db
    .insert(userRoles)
    .values({
      userId,
      roleId,
      assignedBy,
      expiresAt,
    })
    .returning();

  return assignment;
}

/**
 * Remove Role from User
 *
 * Removes a role assignment from a user
 *
 * @param userId - User UUID
 * @param roleId - Role UUID
 * @returns Boolean indicating success
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string,
): Promise<boolean> {
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

  return true;
}

/**
 * Get Users with Role
 *
 * Returns all users who have a specific role
 *
 * @param roleSlug - Role slug
 * @param includeExpired - Include expired assignments (default: false)
 * @returns Array of user IDs
 */
export async function getUsersWithRole(
  roleSlug: string,
  includeExpired = false,
) {
  const role = await getRoleBySlug(roleSlug);
  if (!role) return [];

  const query = db
    .select({
      userId: userRoles.userId,
      assignedAt: userRoles.assignedAt,
      expiresAt: userRoles.expiresAt,
    })
    .from(userRoles)
    .where(eq(userRoles.roleId, role.id))
    .orderBy(desc(userRoles.assignedAt));

  const results = await query;

  if (!includeExpired) {
    const now = new Date();
    return results.filter((r) => !r.expiresAt || r.expiresAt > now);
  }

  return results;
}
