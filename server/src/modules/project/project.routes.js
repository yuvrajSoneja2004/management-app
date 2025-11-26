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

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Archived, Completed]
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   type: object
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 */
router.route('/')
    .get(validatePagination, getProjects)
    .post(validateCreateProject, createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
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
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *   put:
 *     summary: Update project
 *     tags: [Projects]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Completed, Archived]
 *     responses:
 *       200:
 *         description: Project updated successfully
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
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
 *         description: Project deleted successfully
 */
router.route('/:id')
    .get(validateProjectId, getProjectById)
    .put(validateProjectId, checkRole(['Admin', 'Owner']), validateUpdateProject, updateProject)
    .delete(validateProjectId, deleteProject);

/**
 * @swagger
 * /api/projects/{id}/members:
 *   post:
 *     summary: Add member to project
 *     tags: [Projects]
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
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Admin, Member, Viewer]
 *     responses:
 *       200:
 *         description: Member added successfully
 */
router.post('/:id/members', validateAddMember, checkRole(['Admin', 'Owner']), addMember);

/**
 * @swagger
 * /api/projects/{id}/archive:
 *   put:
 *     summary: Archive a project
 *     tags: [Projects]
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
 *         description: Project archived successfully
 */
router.put('/:id/archive', validateProjectId, checkRole(['Admin', 'Owner']), archiveProject);

/**
 * @swagger
 * /api/projects/{id}/unarchive:
 *   put:
 *     summary: Restore an archived project
 *     tags: [Projects]
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
 *         description: Project restored successfully
 */
router.put('/:id/unarchive', validateProjectId, checkRole(['Admin', 'Owner']), unarchiveProject);

/**
 * @swagger
 * /api/projects/{id}/invite:
 *   post:
 *     summary: Invite user to project via email
 *     tags: [Invitations]
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
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [Admin, Member, Viewer]
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 */
router.post('/:id/invite', validateInviteMember, inviteMember);

/**
 * @swagger
 * /api/projects/invitations/{token}/accept:
 *   post:
 *     summary: Accept project invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 */
router.post('/invitations/:token/accept', acceptInvitation);

/**
 * @swagger
 * /api/projects/{id}/invitations:
 *   get:
 *     summary: Get project invitations
 *     tags: [Invitations]
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
 *         description: List of invitations
 */
router.get('/:id/invitations', validateProjectId, getProjectInvitations);

/**
 * @swagger
 * /api/projects/invitations/{id}:
 *   delete:
 *     summary: Cancel invitation
 *     tags: [Invitations]
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
 *         description: Invitation cancelled successfully
 */
router.delete('/invitations/:id', cancelInvitation);

/**
 * @swagger
 * /api/projects/{id}/activities:
 *   get:
 *     summary: Get project activity log
 *     tags: [Projects]
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
 *         description: List of activities
 */
router.get('/:id/activities', validateProjectId, validatePagination, getProjectActivities);

module.exports = router;
