// Import Redis client
const Redis = require('ioredis');

// Read environment variables for Redis connection
const redis = new Redis(process.env.REDIS_URL);

// Rate limit settings
const RATE_LIMIT = process.env.RATE_LIMIT || 20;        // Max requests allowed
const WINDOW_SECONDS = process.env.WINDOW_SECONDS || 60; // Time window in seconds

// Middleware function for rate limiting
const rateLimiter = async (req, res, next) => {
    // Use client IP as the unique key
    const clientKey = req.ip;
    // Redis key for this IP
    const redisKey = `rate_limit:${clientKey}`;

    try {
        // Increment the request count for this IP
        const currentCount = await redis.incr(redisKey);

        // If this is the first request, set the expiry for the key
        if (currentCount === 1) {
            await redis.expire(redisKey, WINDOW_SECONDS);
        }

        // If request count exceeds the limit, block the request
        if (currentCount > RATE_LIMIT) {
            // Get time to live (TTL) for the key to tell client when to retry
            const ttl = await redis.ttl(redisKey);
            return res.status(429) // 429 Too Many Requests
                .set('Retry-After', ttl)
                .json({ error: `Too many requests. Try again in ${ttl} seconds.` });
        }

        // Set rate limit headers for client awareness
        res.set({
            'X-RateLimit-Limit': RATE_LIMIT,
            'X-RateLimit-Remaining': RATE_LIMIT - currentCount
        });

        // Allow request to proceed
        next();
    } catch (error) {
        // If Redis is down or some error occurs, log and allow request
        console.error('Redis error:', error);
        next();
    }
};

module.exports = rateLimiter;
