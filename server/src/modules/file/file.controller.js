const fileService = require('./file.service');

/**
 * File Controller
 * Handles HTTP requests/responses ONLY
 * All business logic delegated to file.service.js
 */

// @desc    Upload file and attach to task
// @route   POST /api/files/upload/:taskId
// @access  Private (Project Members Only)
exports.uploadFile = async (req, res, next) => {
    try {
        const task = await fileService.uploadFile(
            req.params.taskId,
            req.user._id,
            req.file,
            req.app.get('io')
        );

        res.json(task);
    } catch (error) {
        if (error.message === 'No file uploaded') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Task not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Access denied. You are not a member of this project.') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    uploadFile: exports.uploadFile
};
