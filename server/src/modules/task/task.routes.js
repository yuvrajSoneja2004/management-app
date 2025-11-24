const express = require('express');
const { createTask, getTasksByProject, updateTask, deleteTask } = require('./task.controller');
const { protect } = require('../../middleware/auth.middleware');
// Note: Task RBAC is complex because we need to look up the project from the task ID for update/delete.
// For simplicity, we'll keep the logic inside the controller for now, or we'd need a more advanced middleware.

const router = express.Router();

router.use(protect);

router.post('/', createTask); // Controller checks membership
router.get('/project/:projectId', getTasksByProject); // Controller checks membership
router.put('/:id', updateTask); // Controller checks membership
router.delete('/:id', deleteTask); // Controller checks membership

module.exports = router;
