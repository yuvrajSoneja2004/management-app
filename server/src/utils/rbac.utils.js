const Project = require('../modules/project/project.model');

/**
 * Get user's role in a project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Role or null if not a member
 */
const getUserRole = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return null;

    // Check if owner
    if (project.owner.toString() === userId.toString()) {
        return 'Owner';
    }

    // Check if member
    const member = project.members.find(m => m.user.toString() === userId.toString());
    return member ? member.role : null;
};

/**
 * Check if user has permission for an action
 * @param {string} role - User's role
 * @param {string} action - Action to perform
 * @param {object} context - Additional context (e.g., is task assigned to user)
 * @returns {boolean} Has permission
 */
const hasPermission = (role, action, context = {}) => {
    const permissions = {
        Owner: ['read', 'create', 'update', 'delete', 'manage'],
        Admin: ['read', 'create', 'update', 'delete', 'manage'],
        Member: ['read', 'create', 'update_own'],
        Viewer: ['read']
    };

    const userPermissions = permissions[role] || [];

    // Special case: Members can only update tasks assigned to them
    if (action === 'update' && role === 'Member') {
        return context.isAssigned || false;
    }

    return userPermissions.includes(action) || userPermissions.includes('manage');
};

/**
 * Check if user is assigned to a task
 * @param {object} task - Task object
 * @param {string} userId - User ID
 * @returns {boolean} Is assigned
 */
const isTaskAssignee = (task, userId) => {
    if (!task.assignees || task.assignees.length === 0) return false;
    return task.assignees.some(assignee => {
        const assigneeId = assignee._id || assignee;
        return assigneeId.toString() === userId.toString();
    });
};

module.exports = {
    getUserRole,
    hasPermission,
    isTaskAssignee
};
