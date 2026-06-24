import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Instantiate Redis Client
export const redisClient = createClient({
  url: redisUrl
});

redisClient.on('error', (err) => {
  // Graceful logs: do not crash Node, just run in memory or direct database lookup
  console.warn(`[Redis Client Warning] ${err.message}`);
});

redisClient.on('connect', () => {
  console.log('[Redis Client] Connected successfully.');
});

// Self-executing async connection block
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('[Redis Startup Warning] Connection failed. Cache will be bypassed.');
  }
})();

export default redisClient;
