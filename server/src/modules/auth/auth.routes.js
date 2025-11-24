const express = require('express');
const { registerUser, loginUser, logoutUser, refresh } = require('./auth.controller');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/refresh', refresh);

module.exports = router;
