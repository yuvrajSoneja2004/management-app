const BaseRepository = require('../../repositories/base.repository');
const Notification = require('./notification.model');

/**
 * Notification Repository
 * Handles all database operations for notifications
 */
class NotificationRepository extends BaseRepository {
    constructor() {
        super(Notification);
    }

    /**
     * Find notifications by user ID
     * @param {String} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of notifications
     */
    async findByUserId(userId, options = {}) {
        const {
            limit = 50,
            skip = 0,
            unreadOnly = false
        } = options;

        const criteria = { user: userId };
        if (unreadOnly) {
            criteria.read = false;
        }

        return await this.find(criteria, {
            populate: [
                { path: 'from', select: 'username email' },
                { path: 'project', select: 'name' },
                { path: 'task', select: 'title' }
            ],
            sort: { createdAt: -1 },
            limit,
            skip
        });
    }

    /**
     * Mark notification as read
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object|null>} Updated notification or null
     */
    async markAsRead(notificationId, userId) {
        return await this.updateOne(
            { _id: notificationId, user: userId },
            { read: true },
            { new: true }
        );
    }

    /**
     * Mark all user notifications as read
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Update result
     */
    async markAllAsRead(userId) {
        return await this.updateMany(
            { user: userId, read: false },
            { read: true }
        );
    }

    /**
     * Delete notification by ID and user
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object|null>} Deleted notification or null
     */
    async deleteByIdAndUser(notificationId, userId) {
        return await this.deleteOne({
            _id: notificationId,
            user: userId
        });
    }

    /**
     * Count unread notifications for user
     * @param {String} userId - User ID
     * @returns {Promise<Number>} Unread count
     */
    async countUnread(userId) {
        return await this.count({
            user: userId,
            read: false
        });
    }

    /**
     * Create notification with validation
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Created notification
     */
    async createNotification(notificationData) {
        const notification = await this.create(notificationData);

        // Populate for response
        return await this.findById(notification._id, {
            populate: [
                { path: 'from', select: 'username email' },
                { path: 'project', select: 'name' },
                { path: 'task', select: 'title' }
            ]
        });
    }
}

module.exports = new NotificationRepository();
