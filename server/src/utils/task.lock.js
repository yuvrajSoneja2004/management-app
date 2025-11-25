/**
 * Task Lock Manager
 * Handles locking for concurrent task updates to prevent race conditions
 */
class TaskLockManager {
    constructor() {
        this.locks = new Map(); // taskId -> { userId, timestamp, timeout }
        this.lockTimeout = 30000; // 30 seconds
    }

    /**
     * Acquire a lock on a task
     * @param {string} taskId - Task ID
     * @param {string} userId - User ID requesting the lock
     * @returns {boolean} True if lock acquired, false if already locked
     */
    acquireLock(taskId, userId) {
        const existing = this.locks.get(taskId);

        // Check if already locked by someone else
        if (existing && existing.userId !== userId) {
            // Check if lock has expired
            if (Date.now() - existing.timestamp < this.lockTimeout) {
                return false; // Still locked by someone else
            }
            // Lock expired, clear it
            this.releaseLock(taskId);
        }

        // Acquire new lock
        const timeout = setTimeout(() => {
            this.releaseLock(taskId);
        }, this.lockTimeout);

        this.locks.set(taskId, {
            userId,
            timestamp: Date.now(),
            timeout
        });

        return true;
    }

    /**
     * Release a lock on a task
     * @param {string} taskId - Task ID
     * @param {string} userId - User ID (optional, for verification)
     * @returns {boolean} True if lock released, false if not locked or wrong user
     */
    releaseLock(taskId, userId = null) {
        const lock = this.locks.get(taskId);

        if (!lock) {
            return false;
        }

        // If userId provided, verify it matches
        if (userId && lock.userId !== userId) {
            return false;
        }

        // Clear timeout
        if (lock.timeout) {
            clearTimeout(lock.timeout);
        }

        this.locks.delete(taskId);
        return true;
    }

    /**
     * Check if task is locked
     * @param {string} taskId - Task ID
     * @returns {object|null} Lock info or null if not locked
     */
    isLocked(taskId) {
        const lock = this.locks.get(taskId);

        if (!lock) {
            return null;
        }

        // Check if expired
        if (Date.now() - lock.timestamp >= this.lockTimeout) {
            this.releaseLock(taskId);
            return null;
        }

        return {
            userId: lock.userId,
            timestamp: lock.timestamp,
            expiresIn: this.lockTimeout - (Date.now() - lock.timestamp)
        };
    }

    /**
     * Extend an existing lock
     * @param {string} taskId - Task ID
     * @param {string} userId - User ID
     * @returns {boolean} True if lock extended, false otherwise
     */
    extendLock(taskId, userId) {
        const lock = this.locks.get(taskId);

        if (!lock || lock.userId !== userId) {
            return false;
        }

        // Clear old timeout
        if (lock.timeout) {
            clearTimeout(lock.timeout);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
            this.releaseLock(taskId);
        }, this.lockTimeout);

        lock.timestamp = Date.now();
        lock.timeout = timeout;

        return true;
    }

    /**
     * Get all active locks
     * @returns {object} Map of taskId to lock info
     */
    getAllLocks() {
        const activeLocks = {};

        for (const [taskId, lock] of this.locks.entries()) {
            if (Date.now() - lock.timestamp < this.lockTimeout) {
                activeLocks[taskId] = {
                    userId: lock.userId,
                    timestamp: lock.timestamp
                };
            } else {
                this.releaseLock(taskId);
            }
        }

        return activeLocks;
    }

    /**
     * Clear all locks (use with caution)
     */
    clearAll() {
        for (const lock of this.locks.values()) {
            if (lock.timeout) {
                clearTimeout(lock.timeout);
            }
        }
        this.locks.clear();
    }
}

// Export singleton instance
module.exports = new TaskLockManager();
