import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient() {
  // Only initialize at runtime, not at build time
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    // During Next.js build, skip Redis initialization
    return null;
  }

  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    console.log('[Redis] Initializing connection to:', redisUrl);

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
    const client = getRedisClient();
    if (!client) {
      // During build time, return a mock that doesn't fail
      return () => Promise.resolve();
    }
    const value = client[prop as keyof Redis];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default redis;
