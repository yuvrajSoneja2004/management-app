const BaseRepository = require('../../repositories/base.repository');
const User = require('./user.model');

/**
 * Auth Repository
 * Handles all database operations for users/authentication
 */
class AuthRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    /**
     * Find user by email
     * @param {String} email - User email
     * @param {Boolean} includePassword - Whether to include password field
     * @returns {Promise<Object|null>} User or null
     */
    async findByEmail(email, includePassword = false) {
        let query = this.model.findOne({ email });

        if (includePassword) {
            query = query.select('+password');
        }

        return await query;
    }

    /**
     * Find user by refresh token
     * @param {String} refreshToken - Refresh token
     * @returns {Promise<Object|null>} User or null
     */
    async findByRefreshToken(refreshToken) {
        return await this.findOne({ refreshToken });
    }

    /**
     * Find user by reset password token
     * @param {String} hashedToken - Hashed reset token
     * @returns {Promise<Object|null>} User or null
     */
    async findByResetToken(hashedToken) {
        return await this.model.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+password');
    }

    /**
     * Create new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        const user = await this.create(userData);
        // Return user without password
        return await this.findById(user._id);
    }

    /**
     * Update user refresh token
     * @param {String} userId - User ID
     * @param {String} refreshToken - New refresh token
     * @returns {Promise<Object>} Updated user
     */
    async updateRefreshToken(userId, refreshToken) {
        return await this.update(userId, { refreshToken });
    }

    /**
     * Clear user refresh token
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Updated user
     */
    async clearRefreshToken(userId) {
        return await this.update(userId, { refreshToken: '' });
    }

    /**
     * Set password reset token
     * @param {String} userId - User ID
     * @param {String} resetToken - Hashed reset token
     * @param {Date} expiresAt - Expiration date
     * @returns {Promise<Object>} Updated user
     */
    async setResetToken(userId, resetToken, expiresAt) {
        return await this.update(userId, {
            resetPasswordToken: resetToken,
            resetPasswordExpires: expiresAt
        });
    }

    /**
     * Clear password reset token
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Updated user
     */
    async clearResetToken(userId) {
        return await this.update(userId, {
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined
        });
    }

    /**
     * Update user password
     * @param {String} userId - User ID
     * @param {String} newPassword - New password (will be hashed by model)
     * @returns {Promise<Object>} Updated user
     */
    async updatePassword(userId, newPassword) {
        const user = await this.model.findById(userId).select('+password');
        user.password = newPassword;
        await user.save();
        return await this.findById(userId);
    }
}

module.exports = new AuthRepository();
