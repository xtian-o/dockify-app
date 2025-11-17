import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    console.log('[Redis] Initializing connection to:', redisUrl);

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false, // Connect immediately to avoid race conditions
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
      // Keep connection alive
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

// Export a lazy getter function instead of creating the client immediately
export const redis = new Proxy({} as Redis, {
  get(target, prop) {
    return getRedisClient()[prop as keyof Redis];
  }
});

export default redis;
