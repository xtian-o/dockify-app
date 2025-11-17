import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  // Skip DB initialization during Next.js build phase
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    return null;
  }

  if (!dbInstance) {
    // Only create connection at runtime, not at build time
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres';

    try {
      // Configure postgres client for PgBouncer
      // Fix for postgres-js URL parsing issue - add explicit onparameter callback
      const client = postgres(connectionString, {
        prepare: false,
        max: 1, // Important for PgBouncer transaction mode
        idle_timeout: 20,
        connect_timeout: 10,
        ssl: false, // PgBouncer doesn't require SSL internally
        onnotice: () => {}, // Suppress notices
        onparameter: () => {}, // Fix for auth parsing bug
        fetch_types: false, // Disable type fetching to avoid connection issues
        debug: false,
      });

      dbInstance = drizzle(client, { schema });
    } catch (error) {
      console.error('[DB] Failed to initialize connection:', error);
      throw error;
    }
  }

  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) {
      // During build time, return a mock that doesn't fail
      return () => Promise.resolve();
    }
    const value = instance[prop as keyof ReturnType<typeof drizzle>];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
