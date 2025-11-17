// Debug endpoint to check environment variables and connections
import { NextResponse } from 'next/server';

export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL ?
        process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'NOT SET',
      REDIS_URL: process.env.REDIS_URL || 'NOT SET',
      GIT_COMMIT_SHA: process.env.GIT_COMMIT_SHA || 'NOT SET',
    },
    runtime: {
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd(),
    }
  };

  return NextResponse.json(debug, { status: 200 });
}
