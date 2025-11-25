const taskRepository = require('./task.repository');
const projectRepository = require('../project/project.repository');
const notificationService = require('../notification/notification.service');
const { getUserRole, hasPermission } = require('../../utils/rbac.utils');
const { logActivity } = require('../../utils/activity.utils');
const cacheService = require('../../services/cache.service');

/**
 * Task Service
 * Contains all business logic for tasks
 */
class TaskService {
    /**
     * Create a new task
     * @param {String} userId - User ID
     * @param {Object} taskData - Task data
     * @param {Object} io - Socket.io instance
     * @returns {Promise<Object>} Created task
     */
    async createTask(userId, taskData, io) {
        const { title, description, status, priority, projectId, assignees, dueDate } = taskData;

        // Verify project membership and role
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const userRole = await getUserRole(projectId, userId);
        if (!userRole) {
            throw new Error('Not authorized to create tasks in this project');
        }

        // Check create permission
        if (!hasPermission(userRole, 'create')) {
            throw new Error('Your role does not allow creating tasks');
        }

        const task = await taskRepository.create({
            title,
            description,
            status,
            priority,
            project: projectId,
            assignees,
            dueDate,
            createdBy: userId
        });

        const populatedTask = await taskRepository.findByIdPopulated(task._id);

        // Log activity
        await logActivity(projectId, userId, 'task_created', {
            taskTitle: title,
            taskId: task._id
        });

        // Emit socket event
        if (io) {
            io.to(projectId).emit('taskCreated', populatedTask);
        }

        // Notify assignees
        if (assignees && assignees.length > 0) {
            assignees.forEach(async (assigneeId) => {
                if (assigneeId.toString() !== userId.toString()) {
                    await notificationService.createNotification(
                        assigneeId,
                        'task_assigned',
                        `You were assigned to task: ${title}`,
                        projectId,
                        task._id,
                        userId
                    );
                }
            });
        }

        // Emit socket event for real-time updates
        if (io) {
            io.to(projectId).emit('taskCreated', populatedTask);
        }

        // Invalidate task cache for this project
        await cacheService.deletePattern(`tasks:project:${projectId}:*`);

        return populatedTask;
    }

    /**
     * Get tasks for a project
     * @param {String} projectId - Project ID
     * @param {String} userId - User ID
     * @param {Object} queryParams - Query parameters
     * @returns {Promise<Array>} List of tasks
     */
    async getTasksByProject(projectId, userId, queryParams) {
        // Verify project membership
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const isMember = project.members.some(m => m.user.toString() === userId.toString());
        if (!isMember) {
            throw new Error('Not authorized to view tasks in this project');
        }

        // Build query
        const filters = {};
        if (queryParams.status) filters.status = queryParams.status;
        if (queryParams.priority) filters.priority = queryParams.priority;
        if (queryParams.assignee) filters.assignees = queryParams.assignee;

        // Search
        if (queryParams.search) {
            filters.$or = [
                { title: { $regex: queryParams.search, $options: 'i' } },
                { description: { $regex: queryParams.search, $options: 'i' } }
            ];
        }

        // Sorting
        let sortBy = { updatedAt: -1 };
        if (queryParams.sortBy) {
            switch (queryParams.sortBy) {
                case 'priority':
                    sortBy = { priority: queryParams.order === 'desc' ? -1 : 1 };
                    break;
                case 'status':
                    sortBy = { status: queryParams.order === 'desc' ? -1 : 1 };
                    break;
                case 'dueDate':
                    sortBy = { dueDate: queryParams.order === 'desc' ? -1 : 1 };
                    break;
                case 'createdAt':
                    sortBy = { createdAt: queryParams.order === 'desc' ? -1 : 1 };
                    break;
                default:
                    sortBy = { updatedAt: queryParams.order === 'desc' ? -1 : 1 };
            }
        }

        // Pagination
        const maxLimit = 100;
        const limit = Math.min(parseInt(queryParams.limit) || 50, maxLimit);
        const page = parseInt(queryParams.page) || 1;

        // Check cache
        const cacheKey = `tasks:project:${projectId}:page:${page}:limit:${limit}:${JSON.stringify(filters)}:${JSON.stringify(sortBy)}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch from database
        const tasks = await taskRepository.findByProject(projectId, filters, sortBy, { page, limit });
        const total = await taskRepository.countByProject(projectId, filters);

        const result = {
            tasks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };

        // Cache for 2 minutes
        await cacheService.set(cacheKey, result, 2 * 60 * 1000);

        return result;
    }

    /**
     * Update task
     * @param {String} taskId - Task ID
     * @param {String} userId - User ID
     * @param {Object} updates - Update data
     * @param {Object} io - Socket.io instance
     * @returns {Promise<Object>} Updated task
     */
    async updateTask(taskId, userId, updates, io) {
        const task = await taskRepository.findByIdPopulated(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        // Verify project membership and get role
        const userRole = await getUserRole(task.project._id.toString(), userId);
        if (!userRole) {
            throw new Error('Not authorized to update tasks in this project');
        }

        // Check permissions
        const isAssigned = task.assignees.some(a => a._id.toString() === userId.toString());
        if (!hasPermission(userRole, 'update', { isAssigned })) {
            if (userRole === 'Member' && !isAssigned) {
                throw new Error('Members can only update tasks assigned to them');
            }
            throw new Error('Your role does not allow updating tasks');
        }

        const oldStatus = task.status;
        const oldAssignees = task.assignees.map(a => a._id.toString());

        // Apply updates
        const updatedTask = await taskRepository.update(taskId, {
            ...updates,
            updatedBy: userId
        });

        const populatedTask = await taskRepository.findByIdPopulated(taskId);

        // Log activity
        await logActivity(task.project._id, userId, 'task_updated', {
            taskTitle: task.title,
            taskId: task._id,
            changes: updates
        });

        // Notifications
        // 1. Status change
        if (updates.status && updates.status !== oldStatus) {
            populatedTask.assignees.forEach(async (assignee) => {
                if (assignee._id.toString() !== userId.toString()) {
                    await notificationService.createNotification(
                        assignee._id,
                        'task_updated',
                        `Task "${task.title}" status changed to ${updates.status}`,
                        task.project._id,
                        task._id,
                        userId
                    );
                }
            });
        }

        // 2. New assignees
        if (updates.assignees) {
            updates.assignees.forEach(async (assigneeId) => {
                if (!oldAssignees.includes(assigneeId) && assigneeId !== userId.toString()) {
                    await notificationService.createNotification(
                        assigneeId,
                        'task_assigned',
                        `You were assigned to task: ${task.title}`,
                        task.project._id,
                        task._id,
                        userId
                    );
                }
            });
        }

        // Emit socket event
        if (io) {
            io.to(task.project._id.toString()).emit('taskUpdated', populatedTask);
        }

        // Invalidate task cache for this project
        await cacheService.deletePattern(`tasks:project:${task.project._id}:*`);

        return populatedTask;
    }

    /**
     * Delete task
     * @param {String} taskId - Task ID
     * @param {String} userId - User ID
     * @param {Object} io - Socket.io instance
     * @returns {Promise<Object>} Deletion result
     */
    async deleteTask(taskId, userId, io) {
        const task = await taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        // Verify project membership and get role
        const userRole = await getUserRole(task.project.toString(), userId);
        if (!userRole) {
            throw new Error('Not authorized to delete tasks in this project');
        }

        // Only Admin and Owner can delete tasks
        if (!hasPermission(userRole, 'delete')) {
            throw new Error('Only Admins and Owners can delete tasks');
        }

        await taskRepository.delete(taskId);

        // Log activity
        await logActivity(task.project.toString(), userId, 'task_deleted', {
            taskTitle: task.title,
            taskId: task._id
        });

        // Emit socket event
        if (io) {
            io.to(task.project.toString()).emit('taskDeleted', { taskId, projectId: task.project.toString() });
        }

        // Invalidate task cache for this project
        await cacheService.deletePattern(`tasks:project:${task.project}:*`);

        return { message: 'Task removed', taskId };
    }

    /**
     * Bulk update task status
     * @param {Array<String>} taskIds - Task IDs
     * @param {String} status - New status
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Update result
     */
    async bulkUpdateStatus(taskIds, status, userId) {
        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            throw new Error('taskIds array is required');
        }

        // Verify all tasks exist
        const tasks = await taskRepository.findByIds(taskIds);
        if (tasks.length !== taskIds.length) {
            throw new Error('Some tasks not found');
        }

        // Check permission for each task
        for (const task of tasks) {
            const project = await projectRepository.findById(task.project);
            const isMember = project.members.some(m => m.user.toString() === userId.toString());
            if (!isMember) {
                throw new Error('Not authorized to update some tasks');
            }
        }

        // Update all tasks
        await taskRepository.bulkUpdate(taskIds, { status, updatedBy: userId });

        // Log activity for each project
        const projectIds = [...new Set(tasks.map(t => t.project.toString()))];
        for (const projectId of projectIds) {
            await logActivity(projectId, userId, 'task_updated', {
                action: 'bulk_status_update',
                status,
                taskCount: tasks.filter(t => t.project.toString() === projectId).length
            });
            // Invalidate cache for each affected project
            await cacheService.deletePattern(`tasks:project:${projectId}:*`);
        }

        return { message: `${taskIds.length} tasks updated successfully`, updatedCount: taskIds.length };
    }

    /**
     * Bulk assign tasks
     * @param {Array<String>} taskIds - Task IDs
     * @param {Array<String>} assigneeIds - Assignee IDs
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Update result
     */
    async bulkAssign(taskIds, assigneeIds, userId) {
        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            throw new Error('taskIds array is required');
        }

        // Verify all tasks exist
        const tasks = await taskRepository.findByIds(taskIds);
        if (tasks.length !== taskIds.length) {
            throw new Error('Some tasks not found');
        }

        // Check permission for each task
        for (const task of tasks) {
            const project = await projectRepository.findById(task.project);
            const isMember = project.members.some(m => m.user.toString() === userId.toString());
            if (!isMember) {
                throw new Error('Not authorized to update some tasks');
            }
        }

        // Update all tasks
        await taskRepository.bulkUpdate(taskIds, { assignees: assigneeIds, updatedBy: userId });

        // Log activity for each project
        const projectIds = [...new Set(tasks.map(t => t.project.toString()))];
        for (const projectId of projectIds) {
            await logActivity(projectId, userId, 'task_updated', {
                action: 'bulk_assign',
                assigneeCount: assigneeIds.length,
                taskCount: tasks.filter(t => t.project.toString() === projectId).length
            });
            // Invalidate cache for each affected project
            await cacheService.deletePattern(`tasks:project:${projectId}:*`);
        }

        return { message: `${taskIds.length} tasks assigned successfully`, updatedCount: taskIds.length };
    }

    /**
     * Bulk delete tasks
     * @param {Array<String>} taskIds - Task IDs
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Delete result
     */
    async bulkDelete(taskIds, userId) {
        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            throw new Error('taskIds array is required');
        }

        // Verify all tasks exist
        const tasks = await taskRepository.findByIds(taskIds);
        if (tasks.length !== taskIds.length) {
            throw new Error('Some tasks not found');
        }

        // Check permission for each task
        for (const task of tasks) {
            const project = await projectRepository.findById(task.project);
            const isMember = project.members.some(m => m.user.toString() === userId.toString());
            if (!isMember) {
                throw new Error('Not authorized to delete some tasks');
            }
        }

        // Store project IDs for activity logging
        const projectIds = [...new Set(tasks.map(t => t.project.toString()))];

        // Delete all tasks
        await taskRepository.bulkDelete(taskIds);

        // Log activity for each project
        for (const projectId of projectIds) {
            await logActivity(projectId, userId, 'task_deleted', {
                action: 'bulk_delete',
                taskCount: tasks.filter(t => t.project.toString() === projectId).length
            });
            // Invalidate cache for each affected project
            await cacheService.deletePattern(`tasks:project:${projectId}:*`);
        }

        return { message: `${taskIds.length} tasks deleted successfully`, deletedCount: taskIds.length };
    }
}

module.exports = new TaskService();
