const Task = require('./task.model');
const Project = require('../project/project.model');
const { logActivity } = require('../../utils/activity.utils');
const { getUserRole, hasPermission } = require('../../utils/rbac.utils');
const { createNotification } = require('../notification/notification.controller');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, projectId, assignees, dueDate } = req.body;

        // Verify project membership and role
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const userRole = await getUserRole(projectId, req.user._id);
        if (!userRole) {
            return res.status(403).json({ message: 'Not authorized to create tasks in this project' });
        }

        // Check create permission  
        if (!hasPermission(userRole, 'create')) {
            return res.status(403).json({ message: 'Your role does not allow creating tasks' });
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            project: projectId,
            assignees,
            dueDate,
            createdBy: req.user._id
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignees', 'username email')
            .populate('createdBy', 'username');

        // Log activity
        await logActivity(projectId, req.user._id, 'task_created', {
            taskTitle: title,
            taskId: task._id
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(projectId).emit('taskCreated', populatedTask);

        // Notify assignees
        if (assignees && assignees.length > 0) {
            assignees.forEach(async (assigneeId) => {
                if (assigneeId.toString() !== req.user._id.toString()) {
                    await createNotification(
                        assigneeId,
                        'task_assigned',
                        `You were assigned to task: ${title}`,
                        projectId,
                        task._id,
                        req.user._id
                    );
                }
            });
        }

        res.status(201).json(populatedTask);
    } catch (error) {
        next(error);
    }
};

// @desc    Get tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
exports.getTasksByProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Verify project membership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to view tasks in this project' });
        }

        // Build query
        const query = { project: projectId };

        // Filtering
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.priority) {
            query.priority = req.query.priority;
        }
        if (req.query.assignee) {
            query.assignees = req.query.assignee;
        }

        // Search
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Sorting
        let sortBy = { updatedAt: -1 }; // default
        if (req.query.sortBy) {
            switch (req.query.sortBy) {
                case 'priority':
                    const priorityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
                    sortBy = { priority: req.query.order === 'desc' ? -1 : 1 };
                    break;
                case 'status':
                    sortBy = { status: req.query.order === 'desc' ? -1 : 1 };
                    break;
                case 'dueDate':
                    sortBy = { dueDate: req.query.order === 'desc' ? -1 : 1 };
                    break;
                case 'createdAt':
                    sortBy = { createdAt: req.query.order === 'desc' ? -1 : 1 };
                    break;
                default:
                    sortBy = { updatedAt: req.query.order === 'desc' ? -1 : 1 };
            }
        }

        const tasks = await Task.find(query)
            .populate('assignees', 'username email')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username')
            .sort(sortBy);

        res.json(tasks);
    } catch (error) {
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id).populate('assignees');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify project membership and get role
        const project = await Project.findById(task.project);
        const userRole = await getUserRole(task.project.toString(), req.user._id);

        if (!userRole) {
            return res.status(403).json({ message: 'Not authorized to update tasks in this project' });
        }

        // Check permissions
        const isAssigned = task.assignees.some(a => a._id.toString() === req.user._id.toString());
        if (!hasPermission(userRole, 'update', { isAssigned })) {
            if (userRole === 'Member' && !isAssigned) {
                return res.status(403).json({ message: 'Members can only update tasks assigned to them' });
            }
            return res.status(403).json({ message: 'Your role does not allow updating tasks' });
        }

        const oldStatus = task.status;
        const oldAssignees = task.assignees.map(a => a._id.toString());

        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.status = req.body.status || task.status;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        if (req.body.assignees) task.assignees = req.body.assignees;
        task.updatedBy = req.user._id;

        const updatedTask = await task.save();

        const populatedTask = await Task.findById(updatedTask._id)
            .populate('assignees', 'username email')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        // Log activity
        await logActivity(task.project, req.user._id, 'task_updated', {
            taskTitle: task.title,
            taskId: task._id,
            changes: req.body
        });

        // Notifications
        // 1. Status change
        if (req.body.status && req.body.status !== oldStatus) {
            populatedTask.assignees.forEach(async (assignee) => {
                if (assignee._id.toString() !== req.user._id.toString()) {
                    await createNotification(
                        assignee._id,
                        'task_updated',
                        `Task "${task.title}" status changed to ${task.status}`,
                        task.project,
                        task._id,
                        req.user._id
                    );
                }
            });
        }

        // 2. New assignees
        if (req.body.assignees) {
            req.body.assignees.forEach(async (assigneeId) => {
                if (!oldAssignees.includes(assigneeId) && assigneeId !== req.user._id.toString()) {
                    await createNotification(
                        assigneeId,
                        'task_assigned',
                        `You were assigned to task: ${task.title}`,
                        task.project,
                        task._id,
                        req.user._id
                    );
                }
            });
        }

        // Emit socket event
        const io = req.app.get('io');
        io.to(task.project.toString()).emit('taskUpdated', populatedTask);

        res.json(populatedTask);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify project membership and get role
        const project = await Project.findById(task.project);
        const userRole = await getUserRole(task.project.toString(), req.user._id);

        if (!userRole) {
            return res.status(403).json({ message: 'Not authorized to delete tasks in this project' });
        }

        // Only Admin and Owner can delete tasks
        if (!hasPermission(userRole, 'delete')) {
            return res.status(403).json({ message: 'Only Admins and Owners can delete tasks' });
        }

        await task.deleteOne();

        // Log activity
        await logActivity(task.project.toString(), req.user._id, 'task_deleted', {
            taskTitle: task.title,
            taskId: task._id
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(task.project.toString()).emit('taskDeleted', req.params.id);

        res.json({ message: 'Task removed', taskId: req.params.id });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk update task status
// @route   POST /api/tasks/bulk/status
// @access  Private
exports.bulkUpdateStatus = async (req, res, next) => {
    try {
        const { taskIds, status } = req.body;

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ message: 'taskIds array is required' });
        }

        if (!status) {
            return res.status(400).json({ message: 'status is required' });
        }

        // Verify all tasks exist and user has permission
        const tasks = await Task.find({ _id: { $in: taskIds } });

        if (tasks.length !== taskIds.length) {
            return res.status(404).json({ message: 'Some tasks not found' });
        }

        // Check permission for each task
        for (const task of tasks) {
            const project = await Project.findById(task.project);
            const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to update some tasks' });
            }
        }

        // Update all tasks
        await Task.updateMany(
            { _id: { $in: taskIds } },
            { status, updatedBy: req.user._id }
        );

        // Log activity for each project
        const projectIds = [...new Set(tasks.map(t => t.project.toString()))];
        for (const projectId of projectIds) {
            await logActivity(projectId, req.user._id, 'task_updated', {
                action: 'bulk_status_update',
                status,
                taskCount: tasks.filter(t => t.project.toString() === projectId).length
            });
        }

        res.json({ message: `${taskIds.length} tasks updated successfully`, updatedCount: taskIds.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk assign tasks
// @route   POST /api/tasks/bulk/assign
// @access  Private
exports.bulkAssign = async (req, res, next) => {
    try {
        const { taskIds, assigneeIds } = req.body;

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ message: 'taskIds array is required' });
        }

        if (!assigneeIds || !Array.isArray(assigneeIds) || assigneeIds.length === 0) {
            return res.status(400).json({ message: 'assigneeIds array is required' });
        }

        // Verify all tasks exist and user has permission
        const tasks = await Task.find({ _id: { $in: taskIds } });

        if (tasks.length !== taskIds.length) {
            return res.status(404).json({ message: 'Some tasks not found' });
        }

        // Check permission for each task
        for (const task of tasks) {
            const project = await Project.findById(task.project);
            const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to update some tasks' });
            }
        }

        // Update all tasks
        await Task.updateMany(
            { _id: { $in: taskIds } },
            { assignees: assigneeIds, updatedBy: req.user._id }
        );

        // Log activity for each project
        const projectIds = [...new Set(tasks.map(t => t.project.toString()))];
        for (const projectId of projectIds) {
            await logActivity(projectId, req.user._id, 'task_updated', {
                action: 'bulk_assign',
                assigneeCount: assigneeIds.length,
                taskCount: tasks.filter(t => t.project.toString() === projectId).length
            });
        }

        res.json({ message: `${taskIds.length} tasks assigned successfully`, updatedCount: taskIds.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk delete tasks
// @route   POST /api/tasks/bulk/delete
// @access  Private
exports.bulkDelete = async (req, res, next) => {
    try {
        const { taskIds } = req.body;

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ message: 'taskIds array is required' });
        }

        // Verify all tasks exist and user has permission
        const tasks = await Task.find({ _id: { $in: taskIds } });

        if (tasks.length !== taskIds.length) {
            return res.status(404).json({ message: 'Some tasks not found' });
        }

        // Check permission for each task
        for (const task of tasks) {
            const project = await Project.findById(task.project);
            const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to delete some tasks' });
            }
        }

        // Store project IDs for activity logging
        const projectIds = [...new Set(tasks.map(t => t.project.toString()))];

        // Delete all tasks
        await Task.deleteMany({ _id: { $in: taskIds } });

        // Log activity for each project
        for (const projectId of projectIds) {
            await logActivity(projectId, req.user._id, 'task_deleted', {
                action: 'bulk_delete',
                taskCount: tasks.filter(t => t.project.toString() === projectId).length
            });
        }

        res.json({ message: `${taskIds.length} tasks deleted successfully`, deletedCount: taskIds.length });
    } catch (error) {
        next(error);
    }
};
