const Task = require('./task.model');
const Project = require('../project/project.model');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, projectId, assignees, dueDate } = req.body;

        // Verify project membership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to create tasks in this project' });
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

        // Emit socket event
        const io = req.app.get('io');
        io.to(projectId).emit('taskCreated', populatedTask);

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

        const tasks = await Task.find({ project: projectId })
            .populate('assignees', 'username email')
            .populate('createdBy', 'username')
            .sort({ updatedAt: -1 });

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
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify project membership
        const project = await Project.findById(task.project);
        const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to update tasks in this project' });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )
            .populate('assignees', 'username email')
            .populate('createdBy', 'username');

        // Emit socket event
        const io = req.app.get('io');
        io.to(updatedTask.project.toString()).emit('taskUpdated', updatedTask);

        res.json(updatedTask);
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

        // Verify project membership
        const project = await Project.findById(task.project);
        const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to delete tasks in this project' });
        }

        await task.deleteOne();

        // Emit socket event
        const io = req.app.get('io');
        io.to(task.project.toString()).emit('taskDeleted', req.params.id);

        res.json({ message: 'Task removed', taskId: req.params.id });
    } catch (error) {
        next(error);
    }
};
