const express = require('express');
const { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember } = require('./project.controller');
const { protect } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .get(getProjectById) // All members can view
    .put(checkRole(['Admin', 'Owner']), updateProject) // Only Admin/Owner can update
    .delete(deleteProject); // Only Owner (handled in controller)

router.post('/:id/members', checkRole(['Admin', 'Owner']), addMember);

module.exports = router;
