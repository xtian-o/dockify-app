/**
 * Deployments Table Schema
 *
 * Tracks all application deployments created by users through Dockify
 */

import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Deployment Status Enum
 *
 * - pending: Deployment request received, not yet processed
 * - deploying: Currently being deployed to Kubernetes/ArgoCD
 * - deployed: Successfully deployed and running
 * - failed: Deployment failed
 * - stopped: Deployment stopped by user
 * - deleting: Being deleted from cluster
 * - deleted: Removed from cluster
 */
export const deploymentStatusEnum = pgEnum("deployment_status", [
  "pending",
  "deploying",
  "deployed",
  "failed",
  "stopped",
  "deleting",
  "deleted",
]);

/**
 * Deployment Type Enum
 *
 * Type of application being deployed
 */
export const deploymentTypeEnum = pgEnum("deployment_type", [
  "postgres",
  "redis",
  "mongodb",
  "mysql",
  "nginx",
  "custom",
]);

/**
 * Deployments Table
 */
export const deployments = pgTable(
  "deployments",
  {
    // ==================== PRIMARY KEY ====================
    id: uuid("id").defaultRandom().primaryKey(),

    // ==================== FOREIGN KEYS ====================
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // ==================== DEPLOYMENT INFO ====================
    name: text("name").notNull(), // User-friendly deployment name
    type: deploymentTypeEnum("type").notNull(), // Type of app (postgres, redis, etc.)

    // Docker Image Info
    image: text("image").notNull(), // Docker image name (e.g., postgres, redis)
    tag: text("tag").notNull(), // Docker tag/version (e.g., 17, 16.3)

    // Kubernetes Info
    containerName: text("container_name").notNull(), // K8s deployment name
    namespace: uuid("namespace").notNull().defaultRandom(), // K8s namespace (UUID for isolation)

    // Resource Configuration
    port: integer("port"), // Service port
    nodePort: integer("node_port").unique(), // NodePort for Cilium (must be unique across all deployments)
    pvcSize: integer("pvc_size"), // Storage size in GB

    // External Access
    externalUrl: text("external_url"), // Public URL to access the service (e.g., http://node-ip:nodePort)
    externalHost: text("external_host"), // External hostname/IP

    // ArgoCD Integration
    argocdAppName: text("argocd_app_name"), // ArgoCD application name
    argocdUrl: text("argocd_url"), // ArgoCD application URL

    // ==================== STATUS & HEALTH ====================
    status: deploymentStatusEnum("status").notNull().default("pending"),
    healthStatus: text("health_status"), // Healthy, Degraded, Progressing, Suspended
    lastSyncTime: timestamp("last_sync_time", { withTimezone: true }), // Last ArgoCD sync

    // Error tracking
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),

    // ==================== METADATA ====================
    // Additional metadata (can store manifests, config, etc.)
    metadata: jsonb("metadata"),

    // ==================== TIMESTAMPS ====================
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deployedAt: timestamp("deployed_at", { withTimezone: true }), // When successfully deployed
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft delete
  },
  (table) => ({
    // ==================== INDEXES ====================
    userIdIdx: index("deployments_user_id_idx").on(table.userId),
    statusIdx: index("deployments_status_idx").on(table.status),
    typeIdx: index("deployments_type_idx").on(table.type),
    createdAtIdx: index("deployments_created_at_idx").on(table.createdAt),
    deletedAtIdx: index("deployments_deleted_at_idx").on(table.deletedAt),

    // Composite indexes for common queries
    userStatusIdx: index("deployments_user_status_idx").on(
      table.userId,
      table.status,
    ),
    typeStatusIdx: index("deployments_type_status_idx").on(
      table.type,
      table.status,
    ),
  }),
);

/**
 * Deployment Type (for SELECT queries)
 */
export type Deployment = typeof deployments.$inferSelect;

/**
 * Insert Deployment Type (for INSERT queries)
 */
export type InsertDeployment = typeof deployments.$inferInsert;
