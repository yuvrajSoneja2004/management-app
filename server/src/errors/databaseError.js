class DatabaseError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} [code='DB_ERROR'] - Optional error code
     */
    constructor(message, code = 'DB_ERROR') {
        super(message);
        this.name = 'DatabaseError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = DatabaseError;
