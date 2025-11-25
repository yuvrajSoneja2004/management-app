const BaseRepository = require('../../repositories/base.repository');
const Invitation = require('./invitation.model');

/**
 * Invitation Repository
 * Handles database operations for project invitations
 */
class InvitationRepository extends BaseRepository {
    constructor() {
        super(Invitation);
    }

    /**
     * Find pending invitations by project ID
     * @param {String} projectId - Project ID
     * @returns {Promise<Array>} Array of invitations
     */
    async findPendingByProjectId(projectId) {
        return await this.find({
            project: projectId,
            status: 'Pending'
        }, {
            populate: [{ path: 'invitedBy', select: 'username email' }],
            sort: { createdAt: -1 }
        });
    }

    /**
     * Find invitation by token
     * @param {String} token - Invitation token
     * @returns {Promise<Object|null>} Invitation with populated fields
     */
    async findByToken(token) {
        return await this.findOne({ token }, {
            populate: [
                { path: 'project', select: 'name' },
                { path: 'invitedBy', select: 'username' }
            ]
        });
    }

    /**
     * Find existing pending invitation
     * @param {String} projectId - Project ID
     * @param {String} email - Email address
     * @returns {Promise<Object|null>} Invitation or null
     */
    async findPendingInvitation(projectId, email) {
        return await this.findOne({
            project: projectId,
            email,
            status: 'Pending'
        });
    }
}

module.exports = new InvitationRepository();
