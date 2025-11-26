const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Jello API Documentation',
            version: '1.0.0',
            description: 'Production-ready REST API for Jello - Team collaboration and project management platform',
            contact: {
                name: 'Jello Support',
                email: 'support@jello.app'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:5000',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT auth token (obtained from /api/auth/login)'
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                    description: 'JWT cookie set after login'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        username: { type: 'string', example: 'johndoe' },
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Project: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string', example: 'Website Redesign' },
                        description: { type: 'string', example: 'Complete redesign of company website' },
                        owner: { $ref: '#/components/schemas/User' },
                        members: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    user: { $ref: '#/components/schemas/User' },
                                    role: { type: 'string', enum: ['Owner', 'Admin', 'Member', 'Viewer'] }
                                }
                            }
                        },
                        status: { type: 'string', enum: ['Active', 'Archived'], default: 'Active' },
                        tags: { type: 'array', items: { type: 'string' } },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Task: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string', example: 'Design homepage mockup' },
                        description: { type: 'string', example: 'Create wireframes and mockups for new homepage' },
                        status: { type: 'string', enum: ['Todo', 'In Progress', 'Review', 'Completed'], default: 'Todo' },
                        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
                        projectId: { type: 'string' },
                        assignees: { type: 'array', items: { type: 'string' } },
                        tags: { type: 'array', items: { type: 'string' } },
                        dueDate: { type: 'string', format: 'date-time' },
                        estimatedTime: { type: 'number', example: 480 },
                        attachments: { type: 'array', items: { type: 'string' } },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Invalid credentials' },
                        message: { type: 'string' }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { error: 'Unauthorized' }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'User does not have permission to perform this action',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { error: 'Forbidden - Insufficient permissions' }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { error: 'Resource not found' }
                        }
                    }
                }
            }
        },
        tags: [
            { name: 'Authentication', description: 'User authentication and registration' },
            { name: 'Projects', description: 'Project management operations' },
            { name: 'Tasks', description: 'Task management and file uploads' },
            { name: 'Invitations', description: 'Project member invitations' },
            { name: 'Notifications', description: 'User notifications' }
        ]
    },
    apis: ['./src/routes/*.js', './src/modules/**/*.routes.js']
};

module.exports = swaggerJsdoc(options);
