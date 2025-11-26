const express = require('express');
const { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember, inviteMember, acceptInvitation, getProjectInvitations, cancelInvitation, getProjectActivities, archiveProject, unarchiveProject } = require('./project.controller');
const { protect } = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');
const {
    validateCreateProject,
    validateUpdateProject,
    validateProjectId,
    validateAddMember,
    validateInviteMember,
    validatePagination
} = require('../../middleware/validation.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(validatePagination, getProjects)
    .post(validateCreateProject, createProject);

router.route('/:id')
    .get(validateProjectId, getProjectById)
    .put(validateProjectId, checkRole(['Admin', 'Owner']), validateUpdateProject, updateProject)
    .delete(validateProjectId, deleteProject);

router.post('/:id/members', validateAddMember, checkRole(['Admin', 'Owner']), addMember);

// Archive/Unarchive routes
router.put('/:id/archive', validateProjectId, checkRole(['Admin', 'Owner']), archiveProject);
router.put('/:id/unarchive', validateProjectId, checkRole(['Admin', 'Owner']), unarchiveProject);

// Invitation routes
router.post('/:id/invite', validateInviteMember, inviteMember);
router.post('/invitations/:token/accept', acceptInvitation);
router.get('/:id/invitations', validateProjectId, getProjectInvitations);
router.delete('/invitations/:id', cancelInvitation);
router.get('/:id/activities', validateProjectId, validatePagination, getProjectActivities);

module.exports = router;
