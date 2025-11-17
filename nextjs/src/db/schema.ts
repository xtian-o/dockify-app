/**
 * Database Schema Index
 *
 * Centralized export for all database tables
 */

// Export all tables
export * from "./schema/health-checks";
export * from "./schema/users";
export * from "./schema/auth-accounts";
export * from "./schema/auth-sessions";
export * from "./schema/auth-verification-tokens";

// RBAC tables
export * from "./schema/roles";
export * from "./schema/permissions";
export * from "./schema/user-roles";
export * from "./schema/role-permissions";

// Deployment tables
export * from "./schema/deployments";
export * from "./schema/deployment-env-vars";
