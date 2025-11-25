const AppError = require('./AppError');

/**
 * Validation Error (400)
 * Used for input validation failures
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = []) {
        super(message, 400, true);
        this.errors = errors;
    }
}

module.exports = ValidationError;
