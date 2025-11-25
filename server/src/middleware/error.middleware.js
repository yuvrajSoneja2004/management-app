const logger = require('../config/logger');
const AppError = require('../errors/AppError');
const ValidationError = require('../errors/ValidationError');
const AuthenticationError = require('../errors/AuthenticationError');
const AuthorizationError = require('../errors/AuthorizationError');
const NotFoundError = require('../errors/NotFoundError');
const DatabaseError = require('../errors/databaseError');

/**
 * Enhanced Error Handler Middleware
 * Handles all types of errors with proper logging and consistent response format
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?._id
    });

    let statusCode = 500;
    let message = 'Internal Server Error';

    // Handle custom error classes
    if (err instanceof ValidationError) {
        statusCode = 400;
        message = err.message;
        return res.status(statusCode).json({
            success: false,
            error: message,
            errors: err.errors,
            statusCode,
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
        });
    }

    if (err instanceof AuthenticationError) {
        statusCode = 401;
        message = err.message;
    } else if (err instanceof AuthorizationError) {
        statusCode = 403;
        message = err.message;
    } else if (err instanceof NotFoundError) {
        statusCode = 404;
        message = err.message;
    } else if (err instanceof DatabaseError) {
        statusCode = 500;
        message = 'Database Error';
    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    // Mongoose validation error
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }
    // Mongoose cast error (invalid ObjectId)
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Resource not found. Invalid: ${err.path}`;
    }
    // Mongoose duplicate key error
    else if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyPattern)[0];
        message = `Duplicate field value: ${field}. Please use another value.`;
    }
    // JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Express-validator errors (handled in validation middleware, but just in case)
    else if (err.array && typeof err.array === 'function') {
        statusCode = 400;
        message = 'Validation failed';
        return res.status(statusCode).json({
            success: false,
            error: message,
            errors: err.array(),
            statusCode,
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
        });
    }
    // Generic error messages based on common patterns
    else if (err.message) {
        if (err.message.includes('Not authorized') || err.message.includes('not authorized')) {
            statusCode = 403;
        } else if (err.message.includes('not found') || err.message.includes('Not found')) {
            statusCode = 404;
        } else if (err.statusCode) {
            statusCode = err.statusCode;
        }
        message = err.message;
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        error: message,
        statusCode,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

module.exports = errorHandler;

