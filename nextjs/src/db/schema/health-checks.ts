import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Health check table for testing database connection
export const healthChecks = pgTable('health_checks', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type HealthCheck = typeof healthChecks.$inferSelect;
export type NewHealthCheck = typeof healthChecks.$inferInsert;
