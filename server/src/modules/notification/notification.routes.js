const express = require('express');
const { protect } = require('../../middleware/auth.middleware');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('./notification.controller');

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
