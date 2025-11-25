const BaseRepository = require('../../repositories/base.repository');
const Project = require('./project.model');

/**
 * Project Repository
 * Handles database operations for projects
 */
class ProjectRepository extends BaseRepository {
    constructor() {
        super(Project);
    }

    /**
     * Find projects by user membership
     * @param {String} userId - User ID
     * @returns {Promise<Array>} Array of projects
     */
    async findByMember(userId, options = {}) {
        const { page = 1, limit = 20, lean = true } = options;
        const skip = (page - 1) * limit;

        let query = this.model.find({
            'members.user': userId
        })
            .select('name description status owner members tags createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        if (lean) {
            query = query.lean();
        }

        return await query;
    }

    /**
     * Count projects by user membership
     * @param {String} userId - User ID
     * @returns {Promise<Number>} Count
     */
    async countByMember(userId) {
        return await this.model.countDocuments({
            'members.user': userId
        });
    }

    /**
     * Find project by ID with members populated
     * @param {String} id - Project ID
     * @returns {Promise<Object|null>} Project or null
     */
    async findByIdWithMembers(id) {
        return await this.findById(id, {
            populate: [{ path: 'members.user', select: 'username email' }]
        });
    }

    /**
     * Add member to project
     * @param {String} projectId - Project ID
     * @param {Object} memberData - Member data { user, role }
     * @returns {Promise<Object>} Updated project
     */
    async addMember(projectId, memberData) {
        const project = await this.model.findById(projectId);
        if (!project) return null;

        project.members.push(memberData);
        await project.save();

        return await this.findByIdWithMembers(projectId);
    }

    /**
     * Check if user is a member of project
     * @param {String} projectId - Project ID
     * @param {String} userId - User ID
     * @returns {Promise<Boolean>} True if member
     */
    async isMember(projectId, userId) {
        const project = await this.model.findById(projectId)
            .select('members')
            .lean();
        if (!project) return false;

        return project.members.some(m => m.user.toString() === userId.toString());
    }

    /**
     * Get user role in project
     * @param {String} projectId - Project ID
     * @param {String} userId - User ID
     * @returns {Promise<String|null>} Role or null
     */
    async getMemberRole(projectId, userId) {
        const project = await this.model.findById(projectId)
            .select('members')
            .lean();
        if (!project) return null;

        const member = project.members.find(m => m.user.toString() === userId.toString());
        return member ? member.role : null;
    }
}

module.exports = new ProjectRepository();
