/**
 * In-Memory Cache Service
 * Provides simple caching with TTL support
 */
class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();
    }

    /**
     * Set a value in cache with optional TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
     */
    set(key, value, ttl = 5 * 60 * 1000) {
        this.cache.set(key, value);

        // Clear existing timeout if any
        if (this.ttls.has(key)) {
            clearTimeout(this.ttls.get(key));
        }

        // Set new timeout
        const timeout = setTimeout(() => {
            this.delete(key);
        }, ttl);

        this.ttls.set(key, timeout);
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any} Cached value or undefined
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Delete a specific key from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        if (this.ttls.has(key)) {
            clearTimeout(this.ttls.get(key));
            this.ttls.delete(key);
        }
        this.cache.delete(key);
    }

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Pattern to match (supports wildcards with *)
     */
    deletePattern(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const keysToDelete = [];

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Clear all cache
     */
    clear() {
        // Clear all timeouts
        for (const timeout of this.ttls.values()) {
            clearTimeout(timeout);
        }
        this.ttls.clear();
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {object} Cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
module.exports = new CacheService();
