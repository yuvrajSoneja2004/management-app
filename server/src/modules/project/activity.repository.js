const BaseRepository = require('../../repositories/base.repository');
const Activity = require('./activity.model');

/**
 * Activity Repository
 * Handles database operations for project activities
 */
class ActivityRepository extends BaseRepository {
    constructor() {
        super(Activity);
    }

    /**
     * Find activities by project ID with pagination
     * @param {String} projectId - Project ID
     * @param {Object} options - Pagination options (limit, skip)
     * @returns {Promise<Array>} Array of activities
     */
    async findByProjectId(projectId, options = {}) {
        const { limit = 20, skip = 0 } = options;

        return await this.find({ project: projectId }, {
            populate: [{ path: 'user', select: 'username email' }],
            sort: { createdAt: -1 },
            limit,
            skip
        });
    }

    /**
     * Count activities for a project
     * @param {String} projectId - Project ID
     * @returns {Promise<Number>} Count of activities
     */
    async countByProjectId(projectId) {
        return await this.count({ project: projectId });
    }
}

module.exports = new ActivityRepository();
