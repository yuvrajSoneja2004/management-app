const projectService = require('./project.service');

/**
 * Project Controller
 * Handles HTTP requests/responses ONLY
 * All business logic delegated to project.service.js
 */

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const project = await projectService.createProject(req.user._id, name, description);
        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all projects for current user
// @route   GET /api/projects?page=1&limit=20
// @access  Private
exports.getProjects = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;

        const result = await projectService.getUserProjects(req.user._id, { page, limit, status });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res, next) => {
    try {
        const project = await projectService.getProjectById(req.params.id, req.user._id);
        res.json(project);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to view this project') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
exports.updateProject = async (req, res, next) => {
    try {
        const project = await projectService.updateProject(req.params.id, req.user._id, req.body);
        res.json(project);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to update project') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
exports.deleteProject = async (req, res, next) => {
    try {
        const result = await projectService.deleteProject(req.params.id, req.user._id);
        res.json(result);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to delete project') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin/Owner)
exports.addMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const project = await projectService.addMember(req.params.id, req.user._id, email, role);
        res.json(project);
    } catch (error) {
        if (error.message === 'Project not found' || error.message === 'User not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to add members') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'User is already a member') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Invite member to project
// @route   POST /api/projects/:id/invite
// @access  Private (Admin/Owner)
exports.inviteMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const result = await projectService.inviteMember(req.params.id, req.user._id, email, role);
        res.status(201).json(result);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to invite members') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'User is already a member of this project' ||
            error.message === 'An invitation has already been sent to this email') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Accept invitation
// @route   POST /api/invitations/:token/accept
// @access  Private
exports.acceptInvitation = async (req, res, next) => {
    try {
        const result = await projectService.acceptInvitation(req.params.token, req.user);
        res.json(result);
    } catch (error) {
        if (error.message === 'Invitation not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('already been used') ||
            error.message.includes('expired') ||
            error.message.includes('already a member')) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Get project invitations
// @route   GET /api/projects/:id/invitations
// @access  Private (Admin/Owner)
exports.getProjectInvitations = async (req, res, next) => {
    try {
        const invitations = await projectService.getProjectInvitations(req.params.id, req.user._id);
        res.json(invitations);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to view invitations') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Cancel invitation
// @route   DELETE /api/invitations/:id
// @access  Private (Admin/Owner)
exports.cancelInvitation = async (req, res, next) => {
    try {
        const result = await projectService.cancelInvitation(req.params.id, req.user._id);
        res.json(result);
    } catch (error) {
        if (error.message === 'Invitation not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to cancel invitations') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

//  @desc    Get project activities
// @route   GET /api/projects/:id/activities
// @access  Private (Member)
exports.getProjectActivities = async (req, res, next) => {
    try {
        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            skip: ((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 20)
        };

        const result = await projectService.getProjectActivities(req.params.id, req.user._id, pagination);
        res.json(result);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to view activities') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Archive project
// @route   PUT /api/projects/:id/archive
// @access  Private (Admin only)
exports.archiveProject = async (req, res, next) => {
    try {
        const project = await projectService.archiveProject(req.params.id, req.user._id);
        res.json(project);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to archive project') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Unarchive project
// @route   PUT /api/projects/:id/unarchive
// @access  Private (Admin only)
exports.unarchiveProject = async (req, res, next) => {
    try {
        const project = await projectService.unarchiveProject(req.params.id, req.user._id);
        res.json(project);
    } catch (error) {
        if (error.message === 'Project not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to unarchive project') {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    createProject: exports.createProject,
    getProjects: exports.getProjects,
    getProjectById: exports.getProjectById,
    updateProject: exports.updateProject,
    deleteProject: exports.deleteProject,
    addMember: exports.addMember,
    inviteMember: exports.inviteMember,
    acceptInvitation: exports.acceptInvitation,
    getProjectInvitations: exports.getProjectInvitations,
    cancelInvitation: exports.cancelInvitation,
    getProjectActivities: exports.getProjectActivities,
    archiveProject: exports.archiveProject,
    unarchiveProject: exports.unarchiveProject
};
