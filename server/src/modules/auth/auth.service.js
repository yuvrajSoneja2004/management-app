const authRepository = require('./auth.repository');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../../utils/emailService');

/**
 * Auth Service
 * Contains all business logic for authentication
 */
class AuthService {
    /**
     * Generate Access Token
     * @param {String} userId - User ID
     * @returns {String} JWT access token
     */
    generateAccessToken(userId) {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: '15m'
        });
    }

    /**
     * Generate Refresh Token
     * @param {String} userId - User ID
     * @returns {String} JWT refresh token
     */
    generateRefreshToken(userId) {
        return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '7d'
        });
    }

    /**
     * Register a new user
     * @param {String} username - Username
     * @param {String} email - Email
     * @param {String} password - Password
     * @returns {Promise<Object>} User data with tokens
     * @throws {Error} If user already exists
     */
    async registerUser(username, email, password) {
        // Check if user exists
        const userExists = await authRepository.findByEmail(email);
        if (userExists) {
            throw new Error('User already exists');
        }

        // Create user
        const user = await authRepository.createUser({
            username,
            email,
            password
        });

        // Generate tokens
        const accessToken = this.generateAccessToken(user._id);
        const refreshToken = this.generateRefreshToken(user._id);

        // Save refresh token to DB
        await authRepository.updateRefreshToken(user._id, refreshToken);

        return {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            },
            accessToken,
            refreshToken
        };
    }

    /**
     * Login user
     * @param {String} email - Email
     * @param {String} password - Password
     * @returns {Promise<Object>} User data with tokens
     * @throws {Error} If credentials are invalid
     */
    async loginUser(email, password) {
        // Find user with password
        const user = await authRepository.findByEmail(email, true);

        if (!user || !(await user.matchPassword(password))) {
            throw new Error('Invalid email or password');
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user._id);
        const refreshToken = this.generateRefreshToken(user._id);

        // Save refresh token to DB
        await authRepository.updateRefreshToken(user._id, refreshToken);

        return {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            },
            accessToken,
            refreshToken
        };
    }

    /**
     * Logout user
     * @param {String} refreshToken - Refresh token from cookie
     * @returns {Promise<Object>} Logout result
     */
    async logoutUser(refreshToken) {
        if (!refreshToken) {
            return { message: 'No token to logout' };
        }

        // Find user by refresh token
        const user = await authRepository.findByRefreshToken(refreshToken);

        if (user) {
            await authRepository.clearRefreshToken(user._id);
        }

        return { message: 'Logged out successfully' };
    }

    /**
     * Refresh access token
     * @param {String} refreshToken - Refresh token from cookie
     * @returns {Promise<String>} New access token
     * @throws {Error} If token is invalid
     */
    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new Error('Unauthorized');
        }

        const user = await authRepository.findByRefreshToken(refreshToken);
        if (!user) {
            throw new Error('Forbidden');
        }

        // Verify token
        return new Promise((resolve, reject) => {
            jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET,
                (err, decoded) => {
                    if (err || user._id.toString() !== decoded.id) {
                        reject(new Error('Forbidden'));
                    } else {
                        const accessToken = this.generateAccessToken(user._id);
                        resolve(accessToken);
                    }
                }
            );
        });
    }

    /**
     * Request password reset
     * @param {String} email - User email
     * @returns {Promise<Object>} Reset result
     */
    async forgotPassword(email) {
        const user = await authRepository.findByEmail(email);

        // Don't reveal if user exists for security
        if (!user) {
            return { message: 'If that email exists, a reset link has been sent' };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = Date.now() + 3600000; // 1 hour

        await authRepository.setResetToken(user._id, hashedToken, expiresAt);

        // Send email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, user.username, resetUrl);

        return { message: 'Password reset email sent' };
    }

    /**
     * Reset password
     * @param {String} token - Reset token
     * @param {String} newPassword - New password
     * @returns {Promise<Object>} Reset result
     * @throws {Error} If token is invalid or password is invalid
     */
    async resetPassword(token, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Hash token to compare
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await authRepository.findByResetToken(hashedToken);
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        // Update password
        await authRepository.updatePassword(user._id, newPassword);
        await authRepository.clearResetToken(user._id);

        return { message: 'Password reset successful' };
    }
}

module.exports = new AuthService();
