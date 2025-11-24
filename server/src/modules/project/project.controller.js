const Project = require('./project.model');
const User = require('../auth/user.model');
const Invitation = require('./invitation.model');
const Activity = require('./activity.model');
const { generateInvitationToken, sendInvitationEmail } = require('../../utils/emailService');
const { logActivity } = require('../../utils/activity.utils');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const project = await Project.create({
            name,
            description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'Admin' }]
        });

        // Log activity
        await logActivity(project._id, req.user._id, 'project_created', {
            projectName: project.name
        });

        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find({
            'members.user': req.user._id
        }).sort({ updatedAt: -1 });

        res.json(projects);
    } catch (error) {
        next(error);
    }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('members.user', 'username email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is a member
        const isMember = project.members.some(member => member.user._id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to view this project' });
        }

        res.json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
exports.updateProject = async (req, res, next) => {
    try {
        const { name, description, status } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check permission (Owner or Admin)
        const member = project.members.find(m => m.user.toString() === req.user._id.toString());
        if (!member || member.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to update project' });
        }

        project.name = name || project.name;
        project.description = description || project.description;
        project.status = status || project.status;

        await project.save();

        // Log activity
        await logActivity(project._id, req.user._id, 'project_updated', {
            changes: { name, description, status }
        });

        res.json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete project' });
        }

        await project.deleteOne();
        res.json({ message: 'Project removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin/Owner)
exports.addMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already a member
        if (project.members.some(member => member.user.toString() === user._id.toString())) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        project.members.push({
            user: user._id,
            role: role || 'Viewer'
        });

        await project.save();

        // Populate members for response
        await project.populate('members.user', 'username email');

        // Log activity
        await logActivity(project._id, req.user._id, 'member_added', {
            memberEmail: user.email,
            memberRole: role || 'Viewer'
        });

        res.json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Invite member to project
// @route   POST /api/projects/:id/invite
// @access  Private (Admin/Owner)
exports.inviteMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if requester is Admin or Owner
        const member = project.members.find(m => m.user.toString() === req.user._id.toString());
        const isOwner = project.owner.toString() === req.user._id.toString();
        if (!isOwner && (!member || member.role !== 'Admin')) {
            return res.status(403).json({ message: 'Not authorized to invite members' });
        }

        // Check if user is already a member
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const isMember = project.members.some(m => m.user.toString() === existingUser._id.toString());
            if (isMember) {
                return res.status(400).json({ message: 'User is already a member of this project' });
            }
        }

        // Check for existing pending invitation
        const existingInvitation = await Invitation.findOne({
            project: req.params.id,
            email,
            status: 'Pending'
        });

        if (existingInvitation) {
            return res.status(400).json({ message: 'An invitation has already been sent to this email' });
        }

        // Create invitation
        const token = generateInvitationToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        const invitation = await Invitation.create({
            project: req.params.id,
            email,
            token,
            role: role || 'Viewer',
            invitedBy: req.user._id,
            expiresAt
        });

        // Send invitation email
        await sendInvitationEmail(email, token, project.name, req.user.username);

        // Log activity
        await logActivity(project._id, req.user._id, 'invitation_sent', {
            invitedEmail: email,
            role: role || 'Viewer'
        });

        res.status(201).json({
            message: 'Invitation sent successfully',
            invitation: {
                _id: invitation._id,
                email: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expiresAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Accept invitation
// @route   POST /api/invitations/:token/accept
// @access  Private
exports.acceptInvitation = async (req, res, next) => {
    try {
        const invitation = await Invitation.findOne({ token: req.params.token })
            .populate('project', 'name')
            .populate('invitedBy', 'username');

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (invitation.status !== 'Pending') {
            return res.status(400).json({ message: 'This invitation has already been used or expired' });
        }

        if (new Date() > invitation.expiresAt) {
            invitation.status = 'Expired';
            await invitation.save();
            return res.status(400).json({ message: 'This invitation has expired' });
        }

        // Note: We allow any logged-in user to accept the invitation
        // The invitation link acts as the authorization
        // Optional: Check if invitation email matches (informational only)
        if (invitation.email !== req.user.email) {
            console.log(`Note: Invitation was sent to ${invitation.email} but accepted by ${req.user.email}`);
        }


        // Add user to project
        const project = await Project.findById(invitation.project._id);

        // Check if already a member
        const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
        if (isMember) {
            return res.status(400).json({ message: 'You are already a member of this project' });
        }

        project.members.push({
            user: req.user._id,
            role: invitation.role
        });

        await project.save();

        // Update invitation status
        invitation.status = 'Accepted';
        await invitation.save();

        // Log activity
        await logActivity(project._id, req.user._id, 'invitation_accepted', {
            userEmail: req.user.email,
            role: invitation.role
        });

        res.json({
            message: 'Invitation accepted successfully',
            project: {
                _id: project._id,
                name: project.name,
                role: invitation.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get project invitations
// @route   GET /api/projects/:id/invitations
// @access  Private (Admin/Owner)
exports.getProjectInvitations = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if requester is Admin or Owner
        const member = project.members.find(m => m.user.toString() === req.user._id.toString());
        const isOwner = project.owner.toString() === req.user._id.toString();
        if (!isOwner && (!member || member.role !== 'Admin')) {
            return res.status(403).json({ message: 'Not authorized to view invitations' });
        }

        const invitations = await Invitation.find({
            project: req.params.id,
            status: 'Pending'
        })
            .populate('invitedBy', 'username email')
            .sort({ createdAt: -1 });

        res.json(invitations);
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel invitation
// @route   DELETE /api/invitations/:id
// @access  Private (Admin/Owner)
exports.cancelInvitation = async (req, res, next) => {
    try {
        const invitation = await Invitation.findById(req.params.id);

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        const project = await Project.findById(invitation.project);

        // Check if requester is Admin or Owner
        const member = project.members.find(m => m.user.toString() === req.user._id.toString());
        const isOwner = project.owner.toString() === req.user._id.toString();
        if (!isOwner && (!member || member.role !== 'Admin')) {
            return res.status(403).json({ message: 'Not authorized to cancel invitations' });
        }

        await invitation.deleteOne();

        res.json({ message: 'Invitation cancelled successfully' });
    } catch (error) {
        next(error);
    }
};

//  @desc    Get project activities
// @route   GET /api/projects/:id/activities
// @access  Private (Member)
exports.getProjectActivities = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is a member
        const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to view activities' });
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const activities = await Activity.find({ project: req.params.id })
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Activity.countDocuments({ project: req.params.id });

        res.json({
            activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};
