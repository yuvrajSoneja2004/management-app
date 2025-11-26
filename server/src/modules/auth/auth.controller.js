const authService = require('./auth.service');
const authRepository = require('./auth.repository');

/**
 * Auth Controller
 * Handles HTTP requests/responses ONLY
 * All business logic delegated to auth.service.js
 */

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const result = await authService.registerUser(username, email, password);

        // Send refresh token in HTTP-only cookie
        res.cookie('jwt', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            _id: result.user._id,
            username: result.user.username,
            email: result.user.email,
            accessToken: result.accessToken
        });
    } catch (error) {
        if (error.message === 'User already exists') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        // Send refresh token in HTTP-only cookie
        res.cookie('jwt', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            _id: result.user._id,
            username: result.user.username,
            email: result.user.email,
            accessToken: result.accessToken
        });
    } catch (error) {
        if (error.message === 'Invalid email or password') {
            return res.status(401).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logoutUser = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.jwt;

        const result = await authService.logoutUser(refreshToken);

        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh access token
// @route   GET /api/auth/refresh
// @access  Public
exports.refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.jwt;

        const accessToken = await authService.refreshAccessToken(refreshToken);

        res.json({ accessToken });
    } catch (error) {
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ message: error.message });
        }
        if (error.message === 'Forbidden') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const result = await authService.forgotPassword(email);

        res.json(result);
    } catch (error) {
        console.error('Forgot password error:', error);
        next(error);
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const result = await authService.resetPassword(token, password);

        res.json(result);
    } catch (error) {
        if (error.message === 'Password must be at least 6 characters' ||
            error.message === 'Invalid or expired reset token') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Verify reset token
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
exports.verifyResetToken = async (req, res, next) => {
    try {
        const { token } = req.params;

        const crypto = require('crypto');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await authRepository.findByResetToken(hashedToken);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        res.json({ valid: true });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser: exports.registerUser,
    loginUser: exports.loginUser,
    logoutUser: exports.logoutUser,
    refresh: exports.refresh,
    forgotPassword: exports.forgotPassword,
    resetPassword: exports.resetPassword,
    verifyResetToken: exports.verifyResetToken
};
