const Redis = require('ioredis');
const logger = require('../config/logger');

/**
 * Redis Cache Service
 * Provides caching using Redis with TTL support
 */
class CacheService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3
        });

        this.redis.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.redis.on('connect', () => {
            console.log('Redis Client Connected');
        });
    }

    /**
     * Set a value in cache with optional TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
     */
    async set(key, value, ttl = 5 * 60 * 1000) {
        try {
            const serializedValue = JSON.stringify(value);
            // Redis EX is in seconds
            const ttlSeconds = Math.max(1, Math.ceil(ttl / 1000));
            await this.redis.set(key, serializedValue, 'EX', ttlSeconds);
        } catch (error) {
            console.error(`Cache Set Error (${key}):`, error);
        }
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any>} Cached value or undefined
     */
    async get(key) {
        try {
            const value = await this.redis.get(key);
            if (!value) return undefined;
            return JSON.parse(value);
        } catch (error) {
            console.error(`Cache Get Error (${key}):`, error);
            return undefined;
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        try {
            const exists = await this.redis.exists(key);
            return exists === 1;
        } catch (error) {
            console.error(`Cache Has Error (${key}):`, error);
            return false;
        }
    }

    /**
     * Delete a specific key from cache
     * @param {string} key - Cache key
     */
    async delete(key) {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error(`Cache Delete Error (${key}):`, error);
        }
    }

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Pattern to match (supports wildcards with *)
     */
    async deletePattern(pattern) {
        try {
            // Use SCAN to find keys matching pattern
            const stream = this.redis.scanStream({
                match: pattern,
                count: 100
            });

            stream.on('data', async (keys) => {
                if (keys.length) {
                    const pipeline = this.redis.pipeline();
                    keys.forEach((key) => {
                        pipeline.del(key);
                    });
                    await pipeline.exec();
                }
            });

            stream.on('end', () => {
                // Done deleting
            });
        } catch (error) {
            console.error(`Cache DeletePattern Error (${pattern}):`, error);
        }
    }

    /**
     * Clear all cache
     */
    async clear() {
        try {
            await this.redis.flushdb();
        } catch (error) {
            console.error('Cache Clear Error:', error);
        }
    }

    /**
     * Get cache statistics (approximate)
     * @returns {Promise<object>} Cache stats
     */
    async getStats() {
        try {
            const info = await this.redis.info();
            return { info };
        } catch (error) {
            return { error: error.message };
        }
    }
}

// Export singleton instance
module.exports = new CacheService();
