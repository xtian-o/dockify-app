import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Database connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Configure postgres client for PgBouncer
const client = postgres(connectionString, {
  prepare: false,
  max: 1, // Important for PgBouncer transaction mode
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: false, // PgBouncer doesn't require SSL internally
});

export const db = drizzle(client, { schema });
