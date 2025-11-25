const express = require('express');
const router = express.Router();
const Project = require('../modules/project/project.model');
const Task = require('../modules/task/task.model');
const User = require('../modules/auth/user.model');

/**
 * @route   POST /api/seed/generate
 * @desc    Generate dummy projects and tasks for testing pagination
 * @access  Public (for testing only - remove in production)
 */
router.post('/generate', async (req, res, next) => {
    try {
        // Use first user in database for testing
        const user = await User.findOne();
        if (!user) {
            return res.status(400).json({ error: 'No users found. Please create a user first.' });
        }

        const userId = user._id;
        const { numProjects = 10, tasksPerProject = 50 } = req.body;

        // Limit to prevent abuse
        const maxProjects = 50;
        const maxTasksPerProject = 200;

        const safeNumProjects = Math.min(numProjects, maxProjects);
        const safeTasksPerProject = Math.min(tasksPerProject, maxTasksPerProject);

        const projects = [];

        // Create projects
        for (let i = 0; i < safeNumProjects; i++) {
            const project = await Project.create({
                name: `Test Project ${i + 1}`,
                description: `Generated test project for pagination testing - ${new Date().toISOString()}`,
                owner: userId,
                members: [{ user: userId, role: 'Admin' }],
            });
            projects.push(project);
        }

        // Create tasks for each project
        let totalTasks = 0;
        for (const project of projects) {
            const tasks = [];
            for (let j = 0; j < safeTasksPerProject; j++) {
                tasks.push({
                    title: `Task ${j + 1} - ${project.name}`,
                    description: `Test task for pagination testing`,
                    status: ['Todo', 'In Progress', 'Review', 'Completed'][Math.floor(Math.random() * 4)],
                    priority: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
                    project: project._id,
                    assignees: [],
                    createdBy: userId
                });
            }
            await Task.insertMany(tasks);
            totalTasks += tasks.length;
        }

        res.json({
            success: true,
            message: 'Dummy data generated successfully',
            data: {
                projectsCreated: projects.length,
                tasksCreated: totalTasks,
                projectIds: projects.map(p => p._id)
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   DELETE /api/seed/cleanup
 * @desc    Delete all test projects and tasks
 * @access  Public (for testing only - remove in production)
 */
router.delete('/cleanup', async (req, res, next) => {
    try {
        // Find all projects with "Test Project" in name
        const testProjects = await Project.find({
            name: { $regex: /^Test Project \d+$/ }
        });

        const projectIds = testProjects.map(p => p._id);

        // Delete all tasks associated with these projects
        const deletedTasks = await Task.deleteMany({ project: { $in: projectIds } });

        // Delete the projects
        const deletedProjects = await Project.deleteMany({ _id: { $in: projectIds } });

        res.json({
            success: true,
            message: 'Test data cleaned up successfully',
            data: {
                projectsDeleted: deletedProjects.deletedCount,
                tasksDeleted: deletedTasks.deletedCount
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
