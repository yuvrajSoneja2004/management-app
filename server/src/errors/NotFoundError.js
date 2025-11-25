const AppError = require('./AppError');

/**
 * Not Found Error (404)
 * Used when a requested resource doesn't exist
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', resource = null) {
        super(message, 404, true);
        this.resource = resource;
    }
}

module.exports = NotFoundError;
