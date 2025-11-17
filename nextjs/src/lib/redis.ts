import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient() {
  // Only initialize at runtime, not at build time
  console.log('[Redis] getRedisClient() called:', {
    isServer: typeof window === 'undefined',
    nodeEnv: process.env.NODE_ENV,
    hasRedisUrl: !!process.env.REDIS_URL,
    redisUrl: process.env.REDIS_URL ? 'SET' : 'NOT SET'
  });

  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    // During Next.js build, skip Redis initialization
    console.log('[Redis] ❌ Skipping initialization - no REDIS_URL in production build');
    return null;
  }

  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    console.log('[Redis] ✨ Initializing connection to:', redisUrl);

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Use lazy connect to defer connection until first command
      connectTimeout: 10000,
      retryStrategy(times) {
        console.log(`[Redis] Retry attempt ${times}/3`);
        if (times > 3) {
          console.log('[Redis] Max retries reached, giving up');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      keepAlive: 30000,
    });

    redisClient.on('connect', () => {
      console.log('[Redis] ✅ Connected successfully to:', redisUrl);
    });

    redisClient.on('ready', () => {
      console.log('[Redis] ✅ Ready to accept commands');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] ❌ Error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });
  }

  return redisClient;
}

// Export a lazy Proxy that defers initialization until first use
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    console.log(`[Redis Proxy] Accessing property: ${String(prop)}`);
    const client = getRedisClient();
    if (!client) {
      // During build time, return a mock that doesn't fail
      console.log(`[Redis Proxy] ❌ No client, returning mock for: ${String(prop)}`);
      return () => Promise.resolve();
    }
    const value = client[prop as keyof Redis];
    console.log(`[Redis Proxy] ✅ Returning real value for: ${String(prop)}`);
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default redis;
