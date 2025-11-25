const BaseRepository = require('../../repositories/base.repository');
const Task = require('./task.model');

/**
 * Task Repository
 * Handles database operations for tasks
 */
class TaskRepository extends BaseRepository {
    constructor() {
        super(Task);
    }

    /**
     * Find task by ID with populated fields
     * @param {String} id - Task ID
     * @returns {Promise<Object|null>} Task or null
     */
    async findByIdPopulated(id) {
        return await this.findById(id, {
            populate: [
                { path: 'assignees', select: 'username email' },
                { path: 'createdBy', select: 'username' },
                { path: 'updatedBy', select: 'username' },
                { path: 'project', select: 'name members' }
            ]
        });
    }

    /**
     * Find tasks by project ID with filters
     * @param {String} projectId - Project ID
     * @param {Object} filters - Filter criteria
     * @param {Object} sort - Sort options
     * @returns {Promise<Array>} List of tasks
     */
    async findByProject(projectId, filters = {}, sort = { updatedAt: -1 }, options = {}) {
        const { page = 1, limit = 50, lean = false } = options;
        const skip = (page - 1) * limit;
        const query = { project: projectId, ...filters };

        let queryBuilder = this.model.find(query)
            .populate([
                { path: 'assignees', select: 'username email' },
                { path: 'createdBy', select: 'username' },
                { path: 'updatedBy', select: 'username' }
            ])
            .sort(sort)
            .skip(skip)
            .limit(limit);

        if (lean) {
            queryBuilder = queryBuilder.lean();
        }

        return await queryBuilder;
    }

    /**
     * Count tasks by project
     * @param {String} projectId - Project ID
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Number>} Count
     */
    async countByProject(projectId, filters = {}) {
        const query = { project: projectId, ...filters };
        return await this.model.countDocuments(query);
    }

    /**
     * Find tasks by IDs
     * @param {Array<String>} ids - Task IDs
     * @returns {Promise<Array>} List of tasks
     */
    async findByIds(ids) {
        return await this.model.find({ _id: { $in: ids } })
            .select('_id title status priority project assignees')
            .lean();
    }

    /**
     * Bulk update tasks
     * @param {Array<String>} ids - Task IDs
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Update result
     */
    async bulkUpdate(ids, updates) {
        return await this.updateMany({ _id: { $in: ids } }, updates);
    }

    /**
     * Bulk delete tasks
     * @param {Array<String>} ids - Task IDs
     * @returns {Promise<Object>} Delete result
     */
    async bulkDelete(ids) {
        return await this.deleteMany({ _id: { $in: ids } });
    }
}

module.exports = new TaskRepository();
