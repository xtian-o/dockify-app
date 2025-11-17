import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true, // Lazy connect - only when needed
      connectTimeout: 10000,
      retryStrategy(times) {
        if (times > 3) return null;
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected to:', redisUrl);
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
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
