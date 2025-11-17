import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    // Only create connection at runtime, not at build time
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres';

    // Configure postgres client for PgBouncer
    const client = postgres(connectionString, {
      prepare: false,
      max: 1, // Important for PgBouncer transaction mode
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: false, // PgBouncer doesn't require SSL internally
    });

    dbInstance = drizzle(client, { schema });
  }

  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});
