const notificationRepository = require('./notification.repository');

/**
 * Notification Service
 * Contains all business logic for notifications
 */
class NotificationService {
    /**
     * Create a new notification
     * @param {String} userId - User to notify
     * @param {String} type - Notification type
     * @param {String} message - Notification message
     * @param {String} projectId - Related project ID
     * @param {String} taskId - Related task ID (optional)
     * @param {String} fromUserId - User who triggered the notification (optional)
     * @returns {Promise<Object>} Created notification
     */
    async createNotification(userId, type, message, projectId, taskId = null, fromUserId = null, io = null) {
        try {
            const notificationData = {
                user: userId,
                type,
                message,
                project: projectId,
                task: taskId,
                from: fromUserId
            };

            const notification = await notificationRepository.createNotification(notificationData);

            // Emit real-time notification if IO instance is provided
            if (io) {
                io.to(`user:${userId}`).emit('notification', notification);
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw new Error('Failed to create notification');
        }
    }

    /**
     * Get user notifications
     * @param {String} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Notifications and unread count
     */
    async getUserNotifications(userId, options = {}) {
        const notifications = await notificationRepository.findByUserId(userId, options);
        const unreadCount = await notificationRepository.countUnread(userId);

        return {
            notifications,
            unreadCount
        };
    }

    /**
     * Mark notification as read
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object>} Updated notification
     * @throws {Error} If notification not found
     */
    async markAsRead(notificationId, userId) {
        const notification = await notificationRepository.markAsRead(notificationId, userId);

        if (!notification) {
            throw new Error('Notification not found or unauthorized');
        }

        return notification;
    }

    /**
     * Mark all notifications as read
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Update result
     */
    async markAllAsRead(userId) {
        const result = await notificationRepository.markAllAsRead(userId);

        return {
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        };
    }

    /**
     * Delete notification
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object>} Deletion result
     * @throws {Error} If notification not found
     */
    async deleteNotification(notificationId, userId) {
        const notification = await notificationRepository.deleteByIdAndUser(notificationId, userId);

        if (!notification) {
            throw new Error('Notification not found or unauthorized');
        }

        return {
            message: 'Notification deleted',
            notification
        };
    }

    /**
     * Get unread notification count
     * @param {String} userId - User ID
     * @returns {Promise<Number>} Unread count
     */
    async getUnreadCount(userId) {
        return await notificationRepository.countUnread(userId);
    }
}

module.exports = new NotificationService();
