/**
 * Database Seed Script
 *
 * Populates the database with initial data:
 * - System roles (admin, moderator, user)
 * - System permissions (granular access control)
 * - Role-permission mappings
 *
 * Run with: bun run db:seed
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  type InsertPermission,
  type InsertRole,
  type InsertRolePermission,
  type InsertUserRole,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "./schema";

/**
 * Seed Data Definitions
 */

// ==================== ROLES ====================
const SYSTEM_ROLES: InsertRole[] = [
  {
    name: "Admin",
    slug: "admin",
    description: "Full system access with all permissions",
    priority: 0,
    isSystem: true,
    isActive: true,
  },
  {
    name: "Moderator",
    slug: "moderator",
    description: "Content moderation and user management",
    priority: 1,
    isSystem: true,
    isActive: true,
  },
  {
    name: "User",
    slug: "user",
    description: "Standard user with basic permissions",
    priority: 2,
    isSystem: true,
    isActive: true,
  },
];

// ==================== PERMISSIONS ====================
const SYSTEM_PERMISSIONS: InsertPermission[] = [
  // ===== USER MANAGEMENT =====
  {
    name: "users:create",
    resource: "users",
    action: "create",
    description: "Create new users",
    isSystem: true,
    isActive: true,
  },
  {
    name: "users:read",
    resource: "users",
    action: "read",
    description: "View user profiles and list users",
    isSystem: true,
    isActive: true,
  },
  {
    name: "users:update",
    resource: "users",
    action: "update",
    description: "Update user information",
    isSystem: true,
    isActive: true,
  },
  {
    name: "users:delete",
    resource: "users",
    action: "delete",
    description: "Delete users (soft delete)",
    isSystem: true,
    isActive: true,
  },
  {
    name: "users:manage-roles",
    resource: "users",
    action: "manage-roles",
    description: "Assign/remove roles to/from users",
    isSystem: true,
    isActive: true,
  },

  // ===== ROLE MANAGEMENT =====
  {
    name: "roles:create",
    resource: "roles",
    action: "create",
    description: "Create new roles",
    isSystem: true,
    isActive: true,
  },
  {
    name: "roles:read",
    resource: "roles",
    action: "read",
    description: "View roles and their permissions",
    isSystem: true,
    isActive: true,
  },
  {
    name: "roles:update",
    resource: "roles",
    action: "update",
    description: "Update role information and permissions",
    isSystem: true,
    isActive: true,
  },
  {
    name: "roles:delete",
    resource: "roles",
    action: "delete",
    description: "Delete roles (non-system roles only)",
    isSystem: true,
    isActive: true,
  },

  // ===== PERMISSION MANAGEMENT =====
  {
    name: "permissions:create",
    resource: "permissions",
    action: "create",
    description: "Create new permissions",
    isSystem: true,
    isActive: true,
  },
  {
    name: "permissions:read",
    resource: "permissions",
    action: "read",
    description: "View all permissions",
    isSystem: true,
    isActive: true,
  },
  {
    name: "permissions:update",
    resource: "permissions",
    action: "update",
    description: "Update permission details",
    isSystem: true,
    isActive: true,
  },
  {
    name: "permissions:delete",
    resource: "permissions",
    action: "delete",
    description: "Delete permissions (non-system permissions only)",
    isSystem: true,
    isActive: true,
  },

  // ===== AUDIT LOGS =====
  {
    name: "audit:read",
    resource: "audit",
    action: "read",
    description: "View audit logs and security events",
    isSystem: true,
    isActive: true,
  },
  {
    name: "audit:export",
    resource: "audit",
    action: "export",
    description: "Export audit logs",
    isSystem: true,
    isActive: true,
  },

  // ===== SESSIONS =====
  {
    name: "sessions:read",
    resource: "sessions",
    action: "read",
    description: "View active sessions",
    isSystem: true,
    isActive: true,
  },
  {
    name: "sessions:revoke",
    resource: "sessions",
    action: "revoke",
    description: "Revoke user sessions",
    isSystem: true,
    isActive: true,
  },

  // ===== SETTINGS =====
  {
    name: "settings:read",
    resource: "settings",
    action: "read",
    description: "View system settings",
    isSystem: true,
    isActive: true,
  },
  {
    name: "settings:update",
    resource: "settings",
    action: "update",
    description: "Update system settings",
    isSystem: true,
    isActive: true,
  },

  // ===== PROFILE (SELF) =====
  {
    name: "profile:read",
    resource: "profile",
    action: "read",
    description: "View own profile",
    isSystem: true,
    isActive: true,
  },
  {
    name: "profile:update",
    resource: "profile",
    action: "update",
    description: "Update own profile",
    isSystem: true,
    isActive: true,
  },
];

/**
 * Run Seed
 */
async function seed() {
  const seedConnectionString =
    process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

  if (!seedConnectionString) {
    throw new Error("DATABASE_URL_DIRECT or DATABASE_URL is not set");
  }

  console.log("🌱 Seeding database...\n");

  // Create connection
  const client = postgres(seedConnectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // ==================== SEED ROLES ====================
    console.log("📝 Creating system roles...");
    const insertedRoles = await db
      .insert(roles)
      .values(SYSTEM_ROLES)
      .onConflictDoUpdate({
        target: roles.slug,
        set: {
          name: SYSTEM_ROLES[0].name, // Dummy set to avoid error
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`✅ Created ${insertedRoles.length} roles:`);
    for (const role of insertedRoles) {
      console.log(
        `   - ${role.name} (${role.slug}) - Priority: ${role.priority}`,
      );
    }

    // ==================== SEED PERMISSIONS ====================
    console.log("\n📝 Creating system permissions...");
    const insertedPermissions = await db
      .insert(permissions)
      .values(SYSTEM_PERMISSIONS)
      .onConflictDoUpdate({
        target: permissions.name,
        set: {
          description: SYSTEM_PERMISSIONS[0].description, // Dummy set to avoid error
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`✅ Created ${insertedPermissions.length} permissions`);

    // Group by resource for display
    const permissionsByResource = insertedPermissions.reduce(
      (acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
      },
      {} as Record<string, typeof insertedPermissions>,
    );

    for (const [resource, perms] of Object.entries(permissionsByResource)) {
      console.log(`   📦 ${resource}:`);
      for (const perm of perms) {
        console.log(`      - ${perm.name}`);
      }
    }

    // ==================== SEED ROLE PERMISSIONS ====================
    console.log("\n📝 Assigning permissions to roles...");

    // Find role IDs
    const adminRole = insertedRoles.find((r) => r.slug === "admin")!;
    const moderatorRole = insertedRoles.find((r) => r.slug === "moderator")!;
    const userRole = insertedRoles.find((r) => r.slug === "user")!;

    // ADMIN: All permissions
    const adminPermissions: InsertRolePermission[] = insertedPermissions.map(
      (perm) => ({
        roleId: adminRole.id,
        permissionId: perm.id,
      }),
    );

    // MODERATOR: User management + audit + sessions
    const moderatorPermissionNames = [
      "users:read",
      "users:update",
      "users:manage-roles",
      "roles:read",
      "permissions:read",
      "audit:read",
      "sessions:read",
      "sessions:revoke",
      "settings:read",
      "profile:read",
      "profile:update",
    ];
    const moderatorPermissions: InsertRolePermission[] = insertedPermissions
      .filter((perm) => moderatorPermissionNames.includes(perm.name))
      .map((perm) => ({
        roleId: moderatorRole.id,
        permissionId: perm.id,
      }));

    // USER: Only profile permissions
    const userPermissionNames = ["profile:read", "profile:update"];
    const userPermissions: InsertRolePermission[] = insertedPermissions
      .filter((perm) => userPermissionNames.includes(perm.name))
      .map((perm) => ({
        roleId: userRole.id,
        permissionId: perm.id,
      }));

    // Insert role permissions
    const allRolePermissions = [
      ...adminPermissions,
      ...moderatorPermissions,
      ...userPermissions,
    ];

    await db
      .insert(rolePermissions)
      .values(allRolePermissions)
      .onConflictDoNothing();

    console.log(`✅ Assigned permissions to roles:`);
    console.log(`   - Admin: ${adminPermissions.length} permissions (all)`);
    console.log(`   - Moderator: ${moderatorPermissions.length} permissions`);
    console.log(`   - User: ${userPermissions.length} permissions`);

    // ==================== ASSIGN ADMIN ROLE ====================
    console.log("\n📝 Assigning admin role to cristian@oancea.ro...");

    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "cristian@oancea.ro"))
      .limit(1);

    if (adminUser) {
      const adminUserRole: InsertUserRole = {
        userId: adminUser.id,
        roleId: adminRole.id,
      };

      await db
        .insert(userRoles)
        .values(adminUserRole)
        .onConflictDoNothing();

      console.log(`✅ Admin role assigned to ${adminUser.email}`);
    } else {
      console.log(`⚠️  User cristian@oancea.ro not found - skipping admin role assignment`);
      console.log(`   (User will be assigned admin role on first login)`);
    }

    console.log("\n✅ Database seeding completed successfully! 🎉\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
