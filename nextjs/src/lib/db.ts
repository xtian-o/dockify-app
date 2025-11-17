import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Database connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it's not supported for Bun
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
