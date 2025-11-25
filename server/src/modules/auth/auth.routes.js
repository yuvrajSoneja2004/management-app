const express = require('express');
const { registerUser, loginUser, logoutUser, refresh, forgotPassword, resetPassword } = require('./auth.controller');
const { authLimiter, resetLimiter } = require('../../middleware/rateLimiter.middleware');
const {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword
} = require('../../middleware/validation.middleware');

const router = express.Router();

router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.post('/logout', logoutUser);
router.get('/refresh', refresh);
router.post('/forgot-password', resetLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);

module.exports = router;
