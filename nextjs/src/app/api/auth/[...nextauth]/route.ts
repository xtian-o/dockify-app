/**
 * NextAuth.js API Route Handler
 *
 * This handles all Auth.js API routes:
 * - GET  /api/auth/signin
 * - POST /api/auth/signin/:provider
 * - GET  /api/auth/signout
 * - POST /api/auth/signout
 * - GET  /api/auth/callback/:provider
 * - GET  /api/auth/session
 * - GET  /api/auth/csrf
 * - GET  /api/auth/providers
 *
 * @see https://authjs.dev/reference/nextjs
 */

import { handlers } from "@/lib/auth";

// Force Node.js runtime for auth routes (required for database, redis, etc.)
export const runtime = "nodejs";

export const { GET, POST } = handlers;
