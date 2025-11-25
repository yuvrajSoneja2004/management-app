const AppError = require('./AppError');

/**
 * Authentication Error (401)
 * Used when authentication fails (invalid credentials, missing token, etc.)
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, true);
    }
}

module.exports = AuthenticationError;
