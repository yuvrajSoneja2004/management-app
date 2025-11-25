const Activity = require('../modules/project/activity.model');

/**
 * Log activity for a project
 * @param {string} projectId - Project ID
 * @param {string} userId - User who performed the action
 * @param {string} action - Action type (task_created, member_added, etc.)
 * @param {object} metadata - Additional information about the action
 */
const logActivity = async (projectId, userId, action, metadata = {}, options = {}) => {
    try {
        await Activity.create([{
            project: projectId,
            user: userId,
            action,
            metadata
        }], options);
    } catch (error) {
        // Log error but don't fail the main operation
        console.error('Activity logging error:', error);
    }
};

module.exports = {
    logActivity
};
