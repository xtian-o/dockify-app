/**
 * Auth Helper Utilities
 *
 * Server-side helper functions for authentication and authorization
 * Use these in Server Components, Server Actions, and Route Handlers
 *
 * IMPORTANT: These functions only work in server-side code!
 * For client-side components, use the SessionProvider and useSession hook.
 */

import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { cache } from "react";
import {
  getUserPermissions,
  getUserRoles,
  userHasPermission,
  userHasRole,
} from "@/db/queries";
import { auth } from "@/lib/auth";

/**
 * Get Current Session (Cached)
 *
 * Returns the current session or null if not authenticated
 * This function is cached per request to avoid multiple database queries
 *
 * @example
 * ```tsx
 * // Server Component
 * export default async function Page() {
 *   const session = await getSession();
 *   if (!session) return <div>Not authenticated</div>;
 *   return <div>Hello, {session.user.name}</div>;
 * }
 * ```
 */
export const getSession = cache(async (): Promise<Session | null> => {
  return await auth();
});

/**
 * Require Authentication
 *
 * Ensures the user is authenticated, otherwise redirects to sign-in page
 * This is useful for protecting entire pages
 *
 * @param redirectTo - Optional redirect URL after successful sign-in
 * @returns Session object (guaranteed to be non-null)
 *
 * @example
 * ```tsx
 * // Server Component
 * export default async function ProtectedPage() {
 *   const session = await requireAuth();
 *   // User is guaranteed to be authenticated here
 *   return <div>Welcome, {session.user.name}</div>;
 * }
 * ```
 */
export async function requireAuth(redirectTo?: string): Promise<Session> {
  const session = await getSession();

  if (!session) {
    const callbackUrl = redirectTo || "/dashboard";
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

/**
 * Require User Status
 *
 * Ensures the user has an "active" status
 * Redirects to sign-in if user is suspended, deleted, or locked
 *
 * @returns Session object with active user
 *
 * @example
 * ```tsx
 * export default async function Page() {
 *   const session = await requireActiveUser();
 *   // User is active and can access this page
 *   return <div>Hello, {session.user.name}</div>;
 * }
 * ```
 */
export async function requireActiveUser(): Promise<Session> {
  const session = await requireAuth();

  if (session.user.status !== "active") {
    redirect("/sign-in?error=AccountInactive");
  }

  return session;
}

/**
 * Require Email Verification
 *
 * Ensures the user has verified their email address
 * Redirects to verification page if email is not verified
 *
 * @returns Session object with verified email
 *
 * @example
 * ```tsx
 * export default async function Page() {
 *   const session = await requireEmailVerified();
 *   // User email is verified
 *   return <div>Hello, {session.user.email}</div>;
 * }
 * ```
 */
export async function requireEmailVerified(): Promise<Session> {
  const session = await requireAuth();

  if (!session.user.emailVerified) {
    redirect("/verify-email");
  }

  return session;
}

/**
 * Get User ID
 *
 * Quick helper to get the current user's ID
 * Returns null if not authenticated
 *
 * @example
 * ```tsx
 * export async function createPost(formData: FormData) {
 *   const userId = await getUserId();
 *   if (!userId) throw new Error("Not authenticated");
 *   // Create post...
 * }
 * ```
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

/**
 * Check if User is Authenticated
 *
 * Simple boolean check for authentication
 * Useful for conditional rendering in Server Components
 *
 * @example
 * ```tsx
 * export default async function Page() {
 *   const isAuthenticated = await isAuth();
 *   return (
 *     <div>
 *       {isAuthenticated ? "Logged in" : "Logged out"}
 *     </div>
 *   );
 * }
 * ```
 */
export async function isAuth(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Assert Authenticated
 *
 * Throws an error if user is not authenticated
 * Useful for Server Actions where you want to throw instead of redirect
 *
 * @throws Error if not authenticated
 * @returns Session object
 *
 * @example
 * ```tsx
 * "use server";
 * export async function updateProfile(data: FormData) {
 *   const session = await assertAuth();
 *   // Update profile...
 * }
 * ```
 */
export async function assertAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

/**
 * Get User or Redirect
 *
 * Similar to requireAuth but returns only the user object
 * Useful when you only need user info, not the full session
 *
 * @returns User object
 *
 * @example
 * ```tsx
 * export default async function Page() {
 *   const user = await getUserOrRedirect();
 *   return <div>Hello, {user.name}</div>;
 * }
 * ```
 */
export async function getUserOrRedirect() {
  const session = await requireAuth();
  return session.user;
}

/**
 * Get User or Null
 *
 * Returns the user object or null if not authenticated
 * Useful for optional authentication
 *
 * @returns User object or null
 *
 * @example
 * ```tsx
 * export default async function Page() {
 *   const user = await getUserOrNull();
 *   return (
 *     <div>
 *       {user ? `Hello, ${user.name}` : "Please sign in"}
 *     </div>
 *   );
 * }
 * ```
 */
export async function getUserOrNull() {
  const session = await getSession();
  return session?.user || null;
}

// ==================== RBAC HELPERS ====================

/**
 * Check if User has Role
 *
 * @param role - Role slug to check
 * @returns Boolean indicating if user has the role
 *
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   const isAdmin = await hasRole("admin");
 *   if (!isAdmin) redirect("/unauthorized");
 *   return <div>Admin Dashboard</div>;
 * }
 * ```
 */
export async function hasRole(role: string): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  return await userHasRole(userId, role);
}

/**
 * Require Role
 *
 * Ensures the user has a specific role, otherwise redirects
 *
 * @param role - Role slug to require
 * @throws Redirects to unauthorized page if user doesn't have role
 *
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   await requireRole("admin");
 *   return <div>Admin Dashboard</div>;
 * }
 * ```
 */
export async function requireRole(role: string): Promise<void> {
  const session = await requireAuth();
  const hasRoleFlag = await userHasRole(session.user.id, role);

  if (!hasRoleFlag) {
    redirect(`/unauthorized?reason=missing-role&role=${role}`);
  }
}

/**
 * Check if User has Permission
 *
 * @param permission - Permission name to check (e.g., "users:create")
 * @returns Boolean indicating if user has the permission
 *
 * @example
 * ```tsx
 * export async function deleteUser(userId: string) {
 *   const canDelete = await hasPermission("users:delete");
 *   if (!canDelete) throw new Error("Unauthorized");
 *   // Delete user...
 * }
 * ```
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  return await userHasPermission(userId, permission);
}

/**
 * Require Permission
 *
 * Ensures the user has a specific permission, otherwise redirects
 *
 * @param permission - Permission name to require
 * @throws Redirects to unauthorized page if user doesn't have permission
 *
 * @example
 * ```tsx
 * export default async function UserManagementPage() {
 *   await requirePermission("users:read");
 *   return <div>User List</div>;
 * }
 * ```
 */
export async function requirePermission(permission: string): Promise<void> {
  const session = await requireAuth();
  const hasPermissionFlag = await userHasPermission(
    session.user.id,
    permission,
  );

  if (!hasPermissionFlag) {
    redirect(
      `/unauthorized?reason=missing-permission&permission=${permission}`,
    );
  }
}

/**
 * Get Current User Roles
 *
 * Returns all roles for the current user
 *
 * @returns Array of roles with metadata
 *
 * @example
 * ```tsx
 * export default async function ProfilePage() {
 *   const roles = await getCurrentUserRoles();
 *   return (
 *     <div>
 *       <h2>Your Roles:</h2>
 *       {roles.map(r => <Badge key={r.role.id}>{r.role.name}</Badge>)}
 *     </div>
 *   );
 * }
 * ```
 */
export async function getCurrentUserRoles() {
  const userId = await getUserId();
  if (!userId) return [];

  return await getUserRoles(userId);
}

/**
 * Get Current User Permissions
 *
 * Returns all permissions for the current user (aggregated from all roles)
 *
 * @returns Array of permissions
 *
 * @example
 * ```tsx
 * export default async function PermissionsPage() {
 *   const permissions = await getCurrentUserPermissions();
 *   return (
 *     <div>
 *       <h2>Your Permissions:</h2>
 *       <ul>
 *         {permissions.map(p => <li key={p.id}>{p.name}</li>)}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export async function getCurrentUserPermissions() {
  const userId = await getUserId();
  if (!userId) return [];

  return await getUserPermissions(userId);
}

/**
 * Check if User has Any Role
 *
 * Checks if user has at least one of the specified roles
 *
 * @param roles - Array of role slugs
 * @returns Boolean
 *
 * @example
 * ```tsx
 * export default async function ModeratorArea() {
 *   const canAccess = await hasAnyRole(["admin", "moderator"]);
 *   if (!canAccess) redirect("/unauthorized");
 *   return <div>Moderator Tools</div>;
 * }
 * ```
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const checks = await Promise.all(
    roles.map((role) => userHasRole(userId, role)),
  );
  return checks.some((has) => has);
}

/**
 * Check if User has All Roles
 *
 * Checks if user has ALL of the specified roles
 *
 * @param roles - Array of role slugs
 * @returns Boolean
 *
 * @example
 * ```tsx
 * export default async function SuperAdminPage() {
 *   const isSuperAdmin = await hasAllRoles(["admin", "developer"]);
 *   if (!isSuperAdmin) redirect("/unauthorized");
 *   return <div>Super Admin Panel</div>;
 * }
 * ```
 */
export async function hasAllRoles(roles: string[]): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const checks = await Promise.all(
    roles.map((role) => userHasRole(userId, role)),
  );
  return checks.every((has) => has);
}
