// Frontend permission utilities matching backend RBAC

export const PERMISSIONS = {
    Viewer: ['read'],
    Member: ['read', 'create', 'update_own'],
    Admin: ['read', 'create', 'update', 'delete', 'manage'],
    Owner: ['read', 'create', 'update', 'delete', 'manage']
};

/**
 * Check if user has permission
 * @param {string} role - User's role in the project
 * @param {string} action - Action to check (create, update, delete, manage)
 * @param {object} context - Additional context (e.g., isAssigned)
 * @returns {boolean}
 */
export const hasPermission = (role, action, context = {}) => {
    if (!role) return false;

    const userPermissions = PERMISSIONS[role] || [];

    // Special case: Members can only update tasks assigned to them
    if (action === 'update' && role === 'Member') {
        return context.isAssigned || false;
    }

    return userPermissions.includes(action) || userPermissions.includes('manage');
};

/**
 * Get permission message
 * @param {string} role - User's role
 * @param {string} action - Action attempted
 * @returns {string}
 */
export const getPermissionMessage = (role, action) => {
    const messages = {
        Viewer: {
            create: "Viewers cannot create tasks",
            update: "Viewers cannot edit tasks",
            delete: "Viewers cannot delete tasks"
        },
        Member: {
            update: "Members can only edit tasks assigned to them",
            delete: "Members cannot delete tasks"
        }
    };

    return messages[role]?.[action] || "You don't have permission to perform this operation";
};

/**
 * Check if user is assigned to a task
 * @param {object} task - Task object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const isTaskAssignee = (task, userId) => {
    if (!task?.assignees || !userId) return false;
    return task.assignees.some(assignee => {
        const assigneeId = assignee._id || assignee;
        return assigneeId === userId;
    });
};
