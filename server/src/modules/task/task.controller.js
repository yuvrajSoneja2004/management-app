const taskService = require('./task.service');

/**
 * Task Controller
 * Handles HTTP requests/responses ONLY
 * All business logic delegated to task.service.js
 */

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
    try {
        const task = await taskService.createTask(req.user._id, req.body, req.app.get('io'));
        res.status(201).json(task);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Not authorized') || error.message.includes('role does not allow')) {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Get tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
exports.getTasksByProject = async (req, res, next) => {
    try {
        const tasks = await taskService.getTasksByProject(req.params.projectId, req.user._id, req.query);
        res.json(tasks);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Not authorized')) {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.user._id, req.body, req.app.get('io'));
        res.json(task);
    } catch (error) {
        if (error.message === 'Task not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Not authorized') || error.message.includes('role does not allow') || error.message.includes('Members can only update')) {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
    try {
        const result = await taskService.deleteTask(req.params.id, req.user._id, req.app.get('io'));
        res.json(result);
    } catch (error) {
        if (error.message === 'Task not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Not authorized') || error.message.includes('Only Admins')) {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Bulk update task status
// @route   POST /api/tasks/bulk/status
// @access  Private
exports.bulkUpdateStatus = async (req, res, next) => {
    try {
        const { taskIds, status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'status is required' });
        }

        const result = await taskService.bulkUpdateStatus(taskIds, status, req.user._id, req.app.get('io'));
        res.json(result);
    } catch (error) {
        if (error.message === 'taskIds array is required') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Some tasks not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Not authorized')) {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Bulk assign tasks
// @route   POST /api/tasks/bulk/assign
// @access  Private
exports.bulkAssign = async (req, res, next) => {
    try {
        const { taskIds, assigneeIds } = req.body;

        if (!assigneeIds || !Array.isArray(assigneeIds) || assigneeIds.length === 0) {
            return res.status(400).json({ message: 'assigneeIds array is required' });
        }

        const result = await taskService.bulkAssign(taskIds, assigneeIds, req.user._id, req.app.get('io'));
        res.json(result);
    } catch (error) {
        if (error.message === 'taskIds array is required') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Some tasks not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Not authorized')) {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Bulk delete tasks
// @route   POST /api/tasks/bulk/delete
// @access  Private
exports.bulkDelete = async (req, res, next) => {
    try {
        const { taskIds } = req.body;
        const result = await taskService.bulkDelete(taskIds, req.user._id, req.app.get('io'));
        res.json(result);
    } catch (error) {
        if (error.message === 'taskIds array is required') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Some tasks not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Not authorized')) {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    createTask: exports.createTask,
    getTasksByProject: exports.getTasksByProject,
    updateTask: exports.updateTask,
    deleteTask: exports.deleteTask,
    bulkUpdateStatus: exports.bulkUpdateStatus,
    bulkAssign: exports.bulkAssign,
    bulkDelete: exports.bulkDelete
};
