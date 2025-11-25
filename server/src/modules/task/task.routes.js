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

router.post('/', validateCreateTask, createTask);
router.get('/project/:projectId', validatePagination, getTasksByProject);
router.put('/:id', validateUpdateTask, updateTask);
router.delete('/:id', validateTaskId, deleteTask);

// Bulk operations
router.post('/bulk/status', validateBulkUpdateStatus, bulkUpdateStatus);
router.post('/bulk/assign', validateBulkAssign, bulkAssign);
router.post('/bulk/delete', validateBulkOperation, bulkDelete);

module.exports = router;
