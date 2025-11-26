const { uploadToAzure } = require('../../config/azure');
const Task = require('../task/task.model');
const Project = require('../project/project.model');
const cacheService = require('../../services/cache.service');

/**
 * File Service
 * Contains all business logic for file operations
 */
class FileService {
    /**
     * Upload file to task
     * @param {String} taskId - Task ID
     * @param {String} userId - User ID
     * @param {Object} file - File object from multer
     * @param {Object} io - Socket.io instance
     * @returns {Promise<Object>} Updated task
     * @throws {Error} If validation fails
     */
    async uploadFile(taskId, userId, file, io) {
        if (!file) {
            throw new Error('No file uploaded');
        }

        // Find task and populate project
        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            throw new Error('Task not found');
        }

        // Authorization: Check if user is a member of the project
        const project = await Project.findById(task.project);
        const isMember = project.members.some(
            member => member.user.toString() === userId.toString()
        );

        if (!isMember) {
            throw new Error('Access denied. You are not a member of this project.');
        }

        // Upload file to Azure
        const uploadedFile = await uploadToAzure(file);

        // Add file to task attachments
        task.attachments.push(uploadedFile);
        await task.save();

        // Populate task for response
        await task.populate('assignees', 'username email');

        // Emit socket event for real-time updates
        if (io) {
            // Emit a specific fileUploaded event so the client can invalidate the cache for the affected task
            io.to(task.project.toString()).emit('fileUploaded', {
                taskId: task._id,
                projectId: task.project.toString(),
                file: uploadedFile
            });
        }

        // Invalidate task cache for this project
        await cacheService.deletePattern(`tasks:project:${task.project._id}:*`);

        return task;
    }

    /**
     * Delete file from task
     * @param {String} taskId - Task ID
     * @param {String} userId - User ID
     * @param {String} fileId - File ID to delete
     * @returns {Promise<Object>} Updated task
     * @throws {Error} If validation fails
     */
    async deleteFile(taskId, userId, fileId) {
        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            throw new Error('Task not found');
        }

        // Authorization: Check if user is a member of the project
        const project = await Project.findById(task.project);
        const isMember = project.members.some(
            member => member.user.toString() === userId.toString()
        );

        if (!isMember) {
            throw new Error('Access denied. You are not a member of this project.');
        }

        // Remove file from attachments
        task.attachments = task.attachments.filter(
            file => file._id.toString() !== fileId
        );

        await task.save();

        // Populate task for response
        await task.populate('assignees', 'username email');

        // Invalidate task cache for this project
        await cacheService.deletePattern(`tasks:project:${task.project._id}:*`);

        return task;
    }
}

module.exports = new FileService();
