/**
 * Deployment Environment Variables Table Schema
 *
 * Stores environment variables for deployments
 * Secrets are encrypted before storage
 */

import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { deployments } from "./deployments";

/**
 * Deployment Environment Variables Table
 */
export const deploymentEnvVars = pgTable(
  "deployment_env_vars",
  {
    // ==================== PRIMARY KEY ====================
    id: uuid("id").defaultRandom().primaryKey(),

    // ==================== FOREIGN KEYS ====================
    deploymentId: uuid("deployment_id")
      .notNull()
      .references(() => deployments.id, { onDelete: "cascade" }),

    // ==================== ENV VAR INFO ====================
    key: text("key").notNull(), // Environment variable name (e.g., POSTGRES_USER)
    value: text("value").notNull(), // Environment variable value (encrypted if isSecret)
    isSecret: boolean("is_secret").notNull().default(false), // Whether this is a secret

    // ==================== METADATA ====================
    description: text("description"), // Optional description

    // ==================== TIMESTAMPS ====================
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // ==================== INDEXES ====================
    deploymentIdIdx: index("deployment_env_vars_deployment_id_idx").on(
      table.deploymentId,
    ),
    keyIdx: index("deployment_env_vars_key_idx").on(table.key),

    // Composite index for unique constraint (one key per deployment)
    deploymentKeyIdx: index("deployment_env_vars_deployment_key_idx").on(
      table.deploymentId,
      table.key,
    ),
  }),
);

/**
 * Deployment Environment Variable Type (for SELECT queries)
 */
export type DeploymentEnvVar = typeof deploymentEnvVars.$inferSelect;

/**
 * Insert Deployment Environment Variable Type (for INSERT queries)
 */
export type InsertDeploymentEnvVar = typeof deploymentEnvVars.$inferInsert;
