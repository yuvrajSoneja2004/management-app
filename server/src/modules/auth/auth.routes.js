const express = require('express');
const { registerUser, loginUser, logoutUser, refresh, forgotPassword, resetPassword } = require('./auth.controller');
const { authLimiter, resetLimiter } = require('../../middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);
router.get('/refresh', refresh);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
