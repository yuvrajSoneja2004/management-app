const express = require('express');
const { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember, inviteMember, acceptInvitation, getProjectInvitations, cancelInvitation, getProjectActivities } = require('./project.controller');
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

// Invitation routes
router.post('/:id/invite', inviteMember); // Controller checks Admin/Owner
router.post('/invitations/:token/accept', acceptInvitation);
router.get('/:id/invitations', getProjectInvitations); // Controller checks Admin/Owner  
router.delete('/invitations/:id', cancelInvitation); // Controller checks Admin/Owner
router.get('/:id/activities', getProjectActivities); // Get activity log

module.exports = router;
