const rateLimit = require('express-rate-limit');

// General API rate limiter - Applied to all /api routes
// For 10K concurrent users, this allows reasonable usage while preventing abuse
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased from 100 to support higher concurrency
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for successful requests to allow legitimate high-volume users
    skipSuccessfulRequests: false,
});

// Strict limiter for authentication endpoints
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Password reset limiter
exports.resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 reset attempts per hour
    message: 'Too many password reset attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// File upload limiter - Stricter due to resource-intensive operations
exports.uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit file uploads to 20 per 15 minutes per IP
    message: 'Too many file uploads, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// NOTE: For production with 10K+ concurrent users across multiple server instances,
// consider implementing Redis-based rate limiting using 'rate-limit-redis' package.
// This ensures rate limits are shared across all server instances in a cluster.
