/**
 * RBAC Client-Side Hooks
 *
 * React hooks for role-based access control in Client Components
 *
 * IMPORTANT: These hooks only work in Client Components (with "use client")
 * For Server Components, use the functions from @/lib/auth-helpers
 */

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/**
 * Use Permission Hook
 *
 * Checks if current user has a specific permission
 * This hook fetches permissions from the server on mount
 *
 * @param permission - Permission name (e.g., "users:create")
 * @returns Object with hasPermission boolean and loading state
 *
 * @example
 * ```tsx
 * "use client";
 * function CreateUserButton() {
 *   const { hasPermission, loading } = usePermission("users:create");
 *
 *   if (loading) return <Skeleton />;
 *   if (!hasPermission) return null;
 *
 *   return <Button>Create User</Button>;
 * }
 * ```
 */
export function usePermission(permission: string) {
  const { data: session, status } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      if (status === "loading") {
        setLoading(true);
        return;
      }

      if (!session?.user?.id) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/check-permission?permission=${encodeURIComponent(permission)}`,
        );
        const data = await response.json();
        setHasPermission(data.hasPermission || false);
      } catch (error) {
        console.error("Failed to check permission:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [permission, session?.user?.id, status]);

  return {
    hasPermission,
    loading: status === "loading" || loading,
  };
}

/**
 * Use Role Hook
 *
 * Checks if current user has a specific role
 *
 * @param role - Role slug (e.g., "admin")
 * @returns Object with hasRole boolean and loading state
 *
 * @example
 * ```tsx
 * "use client";
 * function AdminPanel() {
 *   const { hasRole, loading } = useRole("admin");
 *
 *   if (loading) return <Skeleton />;
 *   if (!hasRole) return <div>Access Denied</div>;
 *
 *   return <div>Admin Dashboard</div>;
 * }
 * ```
 */
export function useRole(role: string) {
  const { data: session, status } = useSession();
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (status === "loading") {
        setLoading(true);
        return;
      }

      if (!session?.user?.id) {
        setHasRole(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/check-role?role=${encodeURIComponent(role)}`,
        );
        const data = await response.json();
        setHasRole(data.hasRole || false);
      } catch (error) {
        console.error("Failed to check role:", error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, [role, session?.user?.id, status]);

  return {
    hasRole,
    loading: status === "loading" || loading,
  };
}

/**
 * Use User Permissions Hook
 *
 * Fetches all permissions for the current user
 *
 * @returns Object with permissions array and loading state
 *
 * @example
 * ```tsx
 * "use client";
 * function PermissionsList() {
 *   const { permissions, loading } = useUserPermissions();
 *
 *   if (loading) return <Skeleton />;
 *
 *   return (
 *     <ul>
 *       {permissions.map(p => (
 *         <li key={p.id}>{p.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useUserPermissions() {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (status === "loading") {
        setLoading(true);
        return;
      }

      if (!session?.user?.id) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/permissions");
        const data = await response.json();
        setPermissions(data.permissions || []);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [session?.user?.id, status]);

  return {
    permissions,
    loading: status === "loading" || loading,
  };
}

/**
 * Use User Roles Hook
 *
 * Fetches all roles for the current user
 *
 * @returns Object with roles array and loading state
 *
 * @example
 * ```tsx
 * "use client";
 * function RolesBadges() {
 *   const { roles, loading } = useUserRoles();
 *
 *   if (loading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       {roles.map(r => (
 *         <Badge key={r.role.id}>{r.role.name}</Badge>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserRoles() {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      if (status === "loading") {
        setLoading(true);
        return;
      }

      if (!session?.user?.id) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/roles");
        const data = await response.json();
        setRoles(data.roles || []);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [session?.user?.id, status]);

  return {
    roles,
    loading: status === "loading" || loading,
  };
}

/**
 * Use Any Permission Hook
 *
 * Checks if user has at least one of the specified permissions
 *
 * @param permissions - Array of permission names
 * @returns Object with hasAnyPermission boolean and loading state
 *
 * @example
 * ```tsx
 * "use client";
 * function ManageUsersButton() {
 *   const { hasAnyPermission, loading } = useAnyPermission([
 *     "users:create",
 *     "users:update",
 *     "users:delete"
 *   ]);
 *
 *   if (loading) return <Skeleton />;
 *   if (!hasAnyPermission) return null;
 *
 *   return <Button>Manage Users</Button>;
 * }
 * ```
 */
export function useAnyPermission(permissions: string[]) {
  const { permissions: userPermissions, loading } = useUserPermissions();

  const hasAnyPermission =
    !loading && userPermissions.some((p) => permissions.includes(p.name));

  return {
    hasAnyPermission,
    loading,
  };
}

/**
 * Use All Permissions Hook
 *
 * Checks if user has ALL of the specified permissions
 *
 * @param permissions - Array of permission names
 * @returns Object with hasAllPermissions boolean and loading state
 *
 * @example
 * ```tsx
 * "use client";
 * function FullAccessButton() {
 *   const { hasAllPermissions, loading } = useAllPermissions([
 *     "users:create",
 *     "users:read",
 *     "users:update",
 *     "users:delete"
 *   ]);
 *
 *   if (loading) return <Skeleton />;
 *   if (!hasAllPermissions) return null;
 *
 *   return <Button>Full User Management</Button>;
 * }
 * ```
 */
export function useAllPermissions(permissions: string[]) {
  const { permissions: userPermissions, loading } = useUserPermissions();

  const hasAllPermissions =
    !loading &&
    permissions.every((p) => userPermissions.some((up) => up.name === p));

  return {
    hasAllPermissions,
    loading,
  };
}
