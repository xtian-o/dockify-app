import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client with proper configuration
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false, // Disable for faster startup
  lazyConnect: false, // Connect immediately
  connectTimeout: 10000,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying after 3 attempts
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Handle connection events
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

export default redis;
