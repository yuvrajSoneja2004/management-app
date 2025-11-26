const express = require('express');
const { createTask, getTasksByProject, updateTask, deleteTask, bulkUpdateStatus, bulkAssign, bulkDelete } = require('./task.controller');
const { protect } = require('../../middleware/auth.middleware');
const {
    validateCreateTask,
    validateUpdateTask,
    validateTaskId,
    validateBulkUpdateStatus,
    validateBulkAssign,
    validateBulkOperation,
    validatePagination
} = require('../../middleware/validation.middleware');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, projectId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Todo, In Progress, Review, Completed]
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Critical]
 *               dueDate:
 *                 type: string
 *                 format: date
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
router.post('/', validateCreateTask, createTask);

/**
 * @swagger
 * /api/tasks/project/{projectId}:
 *   get:
 *     summary: Get tasks for a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 */
router.get('/project/:projectId', validatePagination, getTasksByProject);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.put('/:id', validateUpdateTask, updateTask);
router.delete('/:id', validateTaskId, deleteTask);

/**
 * @swagger
 * /api/tasks/bulk/status:
 *   post:
 *     summary: Bulk update task status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskIds, status]
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Todo, In Progress, Review, Completed]
 *     responses:
 *       200:
 *         description: Tasks updated successfully
 */
router.post('/bulk/status', validateBulkUpdateStatus, bulkUpdateStatus);

/**
 * @swagger
 * /api/tasks/bulk/assign:
 *   post:
 *     summary: Bulk assign tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskIds, assignees]
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tasks assigned successfully
 */
router.post('/bulk/assign', validateBulkAssign, bulkAssign);

/**
 * @swagger
 * /api/tasks/bulk/delete:
 *   post:
 *     summary: Bulk delete tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskIds]
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tasks deleted successfully
 */
router.post('/bulk/delete', validateBulkOperation, bulkDelete);

module.exports = router;
