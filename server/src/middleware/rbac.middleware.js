const Project = require('../modules/project/project.model');

const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            let projectId;

            // Determine projectId source (body, params, or query)
            if (req.params.projectId) {
                projectId = req.params.projectId;
            } else if (req.body.projectId) {
                projectId = req.body.projectId;
            } else if (req.params.id) {
                // If accessing a resource by ID (like task or project), we might need to fetch it to get the project ID
                // For project routes where :id is the project ID
                if (req.baseUrl.includes('projects')) {
                    projectId = req.params.id;
                } else {
                    // For other resources like tasks, we rely on the controller to have attached the project or we fetch it here.
                    // To keep it simple and performant, we'll assume the controller handles resource-specific checks 
                    // OR we require projectId to be passed in specific routes.
                    // For this implementation, let's focus on Project-level routes first.
                    return next();
                }
            }

            if (!projectId) {
                // If we can't determine project ID, we can't check role here. 
                // Allow to proceed if it's a create operation or similar, otherwise block.
                return next();
            }

            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user is owner
            if (project.owner.toString() === req.user._id.toString()) {
                return next();
            }

            // Check member role
            const member = project.members.find(m => m.user.toString() === req.user._id.toString());

            if (!member) {
                return res.status(403).json({ message: 'Not authorized to access this project' });
            }

            if (allowedRoles.includes(member.role)) {
                return next();
            } else {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { checkRole };
