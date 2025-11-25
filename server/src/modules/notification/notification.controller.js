const notificationService = require('./notification.service');

/**
 * Notification Controller
 * Handles HTTP requests/responses ONLY
 * All business logic delegated to notification.service.js
 */

// @desc    Create a notification (used internally by other modules)
// @access  Internal
exports.createNotification = async (userId, type, message, projectId, taskId = null, fromUserId = null) => {
    return await notificationService.createNotification(userId, type, message, projectId, taskId, fromUserId);
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const options = {
            limit: parseInt(req.query.limit) || 50,
            skip: parseInt(req.query.skip) || 0,
            unreadOnly: req.query.unreadOnly === 'true'
        };

        const result = await notificationService.getUserNotifications(req.user._id, options);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user._id);

        res.json(notification);
    } catch (error) {
        if (error.message === 'Notification not found or unauthorized') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
    try {
        const result = await notificationService.markAllAsRead(req.user._id);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
    try {
        const result = await notificationService.deleteNotification(req.params.id, req.user._id);

        res.json(result);
    } catch (error) {
        if (error.message === 'Notification not found or unauthorized') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    createNotification: exports.createNotification,
    getNotifications: exports.getNotifications,
    markAsRead: exports.markAsRead,
    markAllAsRead: exports.markAllAsRead,
    deleteNotification: exports.deleteNotification
};
