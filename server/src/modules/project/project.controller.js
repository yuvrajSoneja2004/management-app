const Project = require('./project.model');
const User = require('../auth/user.model');

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

        res.json(project);
    } catch (error) {
        next(error);
    }
};
