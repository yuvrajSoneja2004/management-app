const AppError = require('./AppError');

/**
 * Authorization Error (403)
 * Used when user is authenticated but lacks permission
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, true);
    }
}

module.exports = AuthorizationError;
