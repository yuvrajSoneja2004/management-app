const { uploadToAzure } = require('../../config/azure');
const Task = require('../task/task.model');

// @desc    Upload file and attach to task
// @route   POST /api/files/upload/:taskId
// @access  Private
exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { taskId } = req.params;
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const uploadedFile = await uploadToAzure(req.file);

        task.attachments.push(uploadedFile);
        await task.save();

        // Emit socket event
        const io = req.app.get('io');
        io.to(task.project.toString()).emit('taskUpdated', task);

        res.json(task);
    } catch (error) {
        next(error);
    }
};
