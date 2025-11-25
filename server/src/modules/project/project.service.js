const mongoose = require('mongoose');
const Task = require('../task/task.model');
const projectRepository = require('./project.repository');
const invitationRepository = require('./invitation.repository');
const activityRepository = require('./activity.repository');
const authRepository = require('../auth/auth.repository');
const { generateInvitationToken, sendInvitationEmail } = require('../../utils/emailService');
const { logActivity } = require('../../utils/activity.utils');
const cacheService = require('../../services/cache.service');

/**
 * Project Service
 * Contains all business logic for projects
 */
class ProjectService {
    /**
     * Create a new project
     * @param {String} userId - Owner ID
     * @param {String} name - Project name
     * @param {String} description - Project description
     * @returns {Promise<Object>} Created project
     */
    async createProject(userId, name, description) {
        const project = await projectRepository.create({
            name,
            description,
            owner: userId,
            members: [{ user: userId, role: 'Admin' }]
        });

        // Log activity
        await logActivity(project._id, userId, 'project_created', {
            projectName: project.name
        });

        // Invalidate cache
        await cacheService.deletePattern(`projects:user:${userId}:*`);

        return project;
    }

    /**
     * Get all projects for user with caching
     * @param {String} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Projects with pagination
     */
    async getUserProjects(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const maxLimit = 100;
        const safeLimit = Math.min(parseInt(limit) || 20, maxLimit);
        const safePage = parseInt(page) || 1;

        const cacheKey = `projects:user:${userId}:page:${safePage}:limit:${safeLimit}`;

        // Check cache
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch from database
        const projects = await projectRepository.findByMember(userId, { page: safePage, limit: safeLimit, lean: true });
        const total = await projectRepository.countByMember(userId);

        const result = {
            projects,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                pages: Math.ceil(total / safeLimit)
            }
        };

        // Cache for 5 minutes
        await cacheService.set(cacheKey, result, 5 * 60 * 1000);

        return result;
    }

    /**
     * Get project by ID
     * @param {String} projectId - Project ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object>} Project details
     * @throws {Error} If project not found or unauthorized
     */
    async getProjectById(projectId, userId) {
        const project = await projectRepository.findByIdWithMembers(projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // Check if user is a member
        const isMember = project.members.some(member => member.user._id.toString() === userId.toString());
        if (!isMember) {
            throw new Error('Not authorized to view this project');
        }

        return project;
    }

    /**
     * Update project
     * @param {String} projectId - Project ID
     * @param {String} userId - User ID (for authorization)
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Updated project
     * @throws {Error} If unauthorized
     */
    async updateProject(projectId, userId, updates) {
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Check permission (Owner or Admin)
        const member = project.members.find(m => m.user.toString() === userId.toString());
        if (!member || member.role !== 'Admin') {
            throw new Error('Not authorized to update project');
        }

        const updatedProject = await projectRepository.update(projectId, updates);

        // Log activity
        await logActivity(projectId, userId, 'project_updated', {
            changes: updates
        });

        // Invalidate cache
        await cacheService.deletePattern(`projects:user:*`);

        return updatedProject;
    }

    /**
     * Delete project
     * @param {String} projectId - Project ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object>} Deletion result
     * @throws {Error} If unauthorized
     */
    async deleteProject(projectId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const project = await projectRepository.findById(projectId);
            if (!project) {
                throw new Error('Project not found');
            }

            if (project.owner.toString() !== userId.toString()) {
                throw new Error('Not authorized to delete project');
            }

            // Delete all tasks associated with the project
            await Task.deleteMany({ project: projectId }).session(session);

            // Delete the project
            await projectRepository.delete(projectId, { session });

            // Log activity
            await logActivity(projectId, userId, 'project_deleted', {
                projectName: project.name
            });

            await session.commitTransaction();

            // Invalidate cache
            await cacheService.deletePattern(`projects:user:*`);

            return { message: 'Project and associated tasks removed' };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Add member directly (Admin/Owner only)
     * @param {String} projectId - Project ID
     * @param {String} userId - Requesting user ID
     * @param {String} email - Member email
     * @param {String} role - Member role
     * @returns {Promise<Object>} Updated project
     */
    async addMember(projectId, userId, email, role) {
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Check permissions handled in controller/middleware usually, but good to double check here if needed
        const member = project.members.find(m => m.user.toString() === userId.toString());
        if (!member || member.role !== 'Admin') {
            throw new Error('Not authorized to add members');
        }

        const userToAdd = await authRepository.findByEmail(email);
        if (!userToAdd) {
            throw new Error('User not found');
        }

        if (await projectRepository.isMember(projectId, userToAdd._id)) {
            throw new Error('User is already a member');
        }

        const updatedProject = await projectRepository.addMember(projectId, {
            user: userToAdd._id,
            role: role || 'Viewer'
        });

        await logActivity(projectId, userId, 'member_added', {
            memberEmail: userToAdd.email,
            memberRole: role || 'Viewer'
        });

        return updatedProject;
    }

    /**
     * Invite member
     * @param {String} projectId - Project ID
     * @param {String} userId - Requesting user ID
     * @param {String} email - Email to invite
     * @param {String} role - Role to assign
     * @returns {Promise<Object>} Invitation result
     */
    async inviteMember(projectId, userId, email, role) {
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Check permissions
        const member = project.members.find(m => m.user.toString() === userId.toString());
        const isOwner = project.owner.toString() === userId.toString();
        if (!isOwner && (!member || member.role !== 'Admin')) {
            throw new Error('Not authorized to invite members');
        }

        // Check if already member
        const existingUser = await authRepository.findByEmail(email);
        if (existingUser) {
            if (await projectRepository.isMember(projectId, existingUser._id)) {
                throw new Error('User is already a member of this project');
            }
        }

        const inviter = await authRepository.findById(userId);
        const inviterName = inviter.username;

        // Check pending invitation
        const existingInvitation = await invitationRepository.findPendingInvitation(projectId, email);
        if (existingInvitation) {
            // Resend email for existing invitation
            try {
                await sendInvitationEmail(email, existingInvitation.token, project.name, inviterName);
                return {
                    message: 'Invitation email resent successfully',
                    invitation: existingInvitation
                };
            } catch (emailError) {
                console.error('Email resend failed:', emailError);
                return {
                    message: 'Invitation exists but email failed to send. You can share the link manually.',
                    invitation: existingInvitation,
                    emailFailed: true,
                    manualLink: `${process.env.CLIENT_URL}/invitations/${existingInvitation.token}/accept`
                };
            }
        }

        // Create new invitation
        const token = generateInvitationToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await invitationRepository.create({
            project: projectId,
            email,
            token,
            role: role || 'Viewer',
            invitedBy: userId,
            expiresAt
        });

        // Send email
        try {
            await sendInvitationEmail(email, token, project.name, inviterName);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the operation, just return warning
            await logActivity(projectId, userId, 'invitation_created_email_failed', {
                invitedEmail: email,
                role: role || 'Viewer'
            });

            return {
                message: 'Invitation created but email failed to send. You can share the link manually.',
                invitation,
                emailFailed: true,
                manualLink: `${process.env.CLIENT_URL}/invitations/${token}/accept`
            };
        }

        await logActivity(projectId, userId, 'invitation_sent', {
            invitedEmail: email,
            role: role || 'Viewer'
        });

        return {
            message: 'Invitation sent successfully',
            invitation
        };
    }

    /**
     * Accept invitation
     * @param {String} token - Invitation token
     * @param {Object} user - User accepting invitation
     * @returns {Promise<Object>} Result with project details
     */
    async acceptInvitation(token, user) {
        const invitation = await invitationRepository.findByToken(token);
        if (!invitation) {
            throw new Error('Invitation not found');
        }

        if (invitation.status !== 'Pending') {
            throw new Error('This invitation has already been used or expired');
        }

        if (new Date() > invitation.expiresAt) {
            await invitationRepository.update(invitation._id, { status: 'Expired' });
            throw new Error('This invitation has expired');
        }

        // Check if already member
        if (await projectRepository.isMember(invitation.project._id, user._id)) {
            throw new Error('You are already a member of this project');
        }

        // Add member
        await projectRepository.addMember(invitation.project._id, {
            user: user._id,
            role: invitation.role
        });

        // Update invitation
        await invitationRepository.update(invitation._id, { status: 'Accepted' });

        // Log activity
        await logActivity(invitation.project._id, user._id, 'invitation_accepted', {
            userEmail: user.email,
            role: invitation.role
        });

        return {
            message: 'Invitation accepted successfully',
            project: {
                _id: invitation.project._id,
                name: invitation.project.name,
                role: invitation.role
            }
        };
    }

    /**
     * Get project invitations
     * @param {String} projectId - Project ID
     * @param {String} userId - Requesting user ID
     * @returns {Promise<Array>} List of invitations
     */
    async getProjectInvitations(projectId, userId) {
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Check permissions
        const member = project.members.find(m => m.user.toString() === userId.toString());
        const isOwner = project.owner.toString() === userId.toString();
        if (!isOwner && (!member || member.role !== 'Admin')) {
            throw new Error('Not authorized to view invitations');
        }

        return await invitationRepository.findPendingByProjectId(projectId);
    }

    /**
     * Cancel invitation
     * @param {String} invitationId - Invitation ID
     * @param {String} userId - Requesting user ID
     * @returns {Promise<Object>} Result
     */
    async cancelInvitation(invitationId, userId) {
        const invitation = await invitationRepository.findById(invitationId);
        if (!invitation) {
            throw new Error('Invitation not found');
        }

        const project = await projectRepository.findById(invitation.project);

        // Check permissions
        const member = project.members.find(m => m.user.toString() === userId.toString());
        const isOwner = project.owner.toString() === userId.toString();
        if (!isOwner && (!member || member.role !== 'Admin')) {
            throw new Error('Not authorized to cancel invitations');
        }

        await invitationRepository.delete(invitationId);
        return { message: 'Invitation cancelled successfully' };
    }

    /**
     * Get project activities
     * @param {String} projectId - Project ID
     * @param {String} userId - Requesting user ID
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} Activities and pagination info
     */
    async getProjectActivities(projectId, userId, pagination) {
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (!await projectRepository.isMember(projectId, userId)) {
            throw new Error('Not authorized to view activities');
        }

        const activities = await activityRepository.findByProjectId(projectId, pagination);
        const total = await activityRepository.countByProjectId(projectId);

        return {
            activities,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                pages: Math.ceil(total / pagination.limit)
            }
        };
    }
}

module.exports = new ProjectService();
