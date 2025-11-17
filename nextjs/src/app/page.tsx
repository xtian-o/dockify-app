import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { healthChecks } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function testConnections() {
  const results = {
    postgres: { status: 'unknown', message: '', details: {} },
    redis: { status: 'unknown', message: '', details: {} },
  };

  // Test PostgreSQL via PgBouncer
  try {
    // Simple SELECT query to test connection
    const result = await db.execute(sql`SELECT 1 as test, version() as pg_version`);

    const timestamp = new Date().toISOString();
    const firstRow = Array.isArray(result) ? result[0] : result;
    const versionStr = (firstRow as any)?.pg_version || 'PostgreSQL 18';
    const version = typeof versionStr === 'string' ? versionStr.split(' ').slice(0, 2).join(' ') : 'PostgreSQL 18';

    results.postgres = {
      status: 'success',
      message: '✅ PostgreSQL connected via PgBouncer',
      details: {
        testQuery: 'SELECT 1',
        version,
        timestamp,
        connectionPool: 'PgBouncer (transaction mode)',
      },
    };
  } catch (error) {
    results.postgres = {
      status: 'error',
      message: '❌ PostgreSQL connection failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }

  // Test Redis
  try {
    // Simple PING test with timeout
    const ping = await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 5000))
    ]) as string;

    // Get basic info
    const info = await redis.info('server');
    const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'Unknown';

    const timestamp = new Date().toISOString();

    results.redis = {
      status: 'success',
      message: '✅ Redis connected',
      details: {
        ping,
        version: redisVersion,
        timestamp,
        status: 'In-memory cache ready',
      },
    };
  } catch (error) {
    results.redis = {
      status: 'error',
      message: '❌ Redis connection failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }

  return results;
}

export default async function Home() {
  const connectionTests = await testConnections();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <main className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🚀 Dockify App</h1>
          <p className="text-gray-400">Next.js 16 + Bun + Drizzle ORM + Redis + PgBouncer</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* PostgreSQL Status */}
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">PostgreSQL</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  connectionTests.postgres.status === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {connectionTests.postgres.status}
              </span>
            </div>
            <p className="mb-4">{connectionTests.postgres.message}</p>
            <div className="bg-gray-900/50 rounded p-4 text-sm">
              <pre className="overflow-x-auto">
                {JSON.stringify(connectionTests.postgres.details, null, 2)}
              </pre>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>📦 Via PgBouncer connection pooler</p>
              <p>🗄️ PostgreSQL 18 (Debian Trixie)</p>
            </div>
          </div>

          {/* Redis Status */}
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Redis</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  connectionTests.redis.status === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {connectionTests.redis.status}
              </span>
            </div>
            <p className="mb-4">{connectionTests.redis.message}</p>
            <div className="bg-gray-900/50 rounded p-4 text-sm">
              <pre className="overflow-x-auto">
                {JSON.stringify(connectionTests.redis.details, null, 2)}
              </pre>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>⚡ Redis 8.2-alpine</p>
              <p>🔄 In-memory data store</p>
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="mt-6 bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold mb-3">🌍 Environment</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Node ENV:</span>
              <span className="ml-2 text-green-400">{process.env.NODE_ENV}</span>
            </div>
            <div>
              <span className="text-gray-400">Runtime:</span>
              <span className="ml-2 text-blue-400">Bun</span>
            </div>
            <div>
              <span className="text-gray-400">Framework:</span>
              <span className="ml-2 text-purple-400">Next.js 16</span>
            </div>
            <div>
              <span className="text-gray-400">Deployed on:</span>
              <span className="ml-2 text-orange-400">Kubernetes</span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-6 flex gap-4">
          <a
            href="/api/health"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Health Check API
          </a>
          <a
            href="https://github.com/xtian-o/dockify-app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            GitHub Repository
          </a>
        </div>
      </main>
    </div>
  );
}
