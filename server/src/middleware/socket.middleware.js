const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Socket.io Authentication Middleware
 * Verifies JWT token before allowing socket connection
 */
const socketAuthMiddleware = async (socket, next) => {
    try {
        // Get token from handshake auth or query params
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            logger.warn(`Socket connection rejected: No token provided. Socket ID: ${socket.id}`);
            return next(new Error('Authentication error: No token provided'));
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user details to get username
        const authRepository = require('../modules/auth/auth.repository');
        const user = await authRepository.findById(decoded.id);

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        // Attach user info to socket
        socket.userId = decoded.id;
        socket.username = user.username;
        socket.user = {
            id: decoded.id,
            email: decoded.email,
            username: user.username
        };

        logger.info(`Socket authenticated: User ${decoded.id} (${user.username}), Socket ID: ${socket.id}`);
        next();
    } catch (error) {
        logger.error(`Socket authentication failed: ${error.message}. Socket ID: ${socket.id}`);

        if (error.name === 'TokenExpiredError') {
            return next(new Error('Authentication error: Token expired'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new Error('Authentication error: Invalid token'));
        }

        return next(new Error('Authentication error'));
    }
};

module.exports = socketAuthMiddleware;
