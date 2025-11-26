const logger = require('../config/logger');
const projectRepository = require('../modules/project/project.repository');
const taskLockManager = require('../utils/task.lock');

/**
 * Initialize Socket.io Event Handlers
 * @param {object} io - Socket.io server instance
 */
function initializeSocketHandlers(io) {
    io.on('connection', (socket) => {
        logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

        // Track user's active rooms
        socket.activeRooms = new Set();

        /**
         * Join a project room
         * Only project members can join
         */
        socket.on('joinProject', async (projectId) => {
            try {
                // Verify user is a project member
                const project = await projectRepository.findByIdWithMembers(projectId);

                if (!project) {
                    socket.emit('error', { message: 'Project not found' });
                    return;
                }

                const isMember = project.members.some(
                    m => m.user._id.toString() === socket.userId.toString()
                );

                if (!isMember) {
                    socket.emit('error', { message: 'Not authorized to join this project' });
                    logger.warn(`Unauthorized project join attempt: User ${socket.userId}, Project ${projectId}`);
                    return;
                }

                // Join the room
                socket.join(projectId);
                socket.activeRooms.add(projectId);

                logger.info(`Socket ${socket.id} joined project ${projectId}`);

                // Get current user info
                const currentUser = project.members.find(m => m.user._id.toString() === socket.userId.toString());

                // Get all active users in this project room
                const socketsInRoom = await io.in(projectId).fetchSockets();
                const activeUsers = socketsInRoom.map(s => ({
                    id: s.userId,
                    username: s.username,
                    socketId: s.id
                }));

                // Notify user they joined
                socket.emit('joinedProject', { projectId, activeUsers });

                // Notify other members with username and project name
                socket.to(projectId).emit('userJoined', {
                    user: {
                        id: socket.userId,
                        username: currentUser?.user?.username || 'Unknown User'
                    },
                    projectId,
                    projectName: project.name
                });

                // Broadcast updated active users list to all in room
                io.to(projectId).emit('activeUsersUpdated', {
                    projectId,
                    users: activeUsers
                });
            } catch (error) {
                logger.error(`Error joining project: ${error.message}`);
                socket.emit('error', { message: 'Failed to join project' });
            }
        });

        // Join user-specific room for personal notifications
        socket.join(`user:${socket.userId}`);

        /**
         * Handle disconnection
         */
        socket.on('disconnect', async () => {
            logger.info(`Client disconnected: ${socket.id}, User: ${socket.userId}`);

            // Release all locks held by this user
            const locks = taskLockManager.getAllLocks();
            for (const [taskId, lock] of Object.entries(locks)) {
                if (lock.userId === socket.userId) {
                    taskLockManager.releaseLock(taskId);

                    // Notify all rooms this user was in
                    for (const projectId of socket.activeRooms) {
                        io.to(projectId).emit('taskUnlocked', { taskId });
                    }
                }
            }

            // Notify rooms about user disconnect and update active users
            for (const projectId of socket.activeRooms) {
                socket.to(projectId).emit('userDisconnected', {
                    userId: socket.userId,
                    projectId
                });

                // Get updated active users list for this project
                const socketsInRoom = await io.in(projectId).fetchSockets();
                const activeUsers = socketsInRoom.map(s => ({
                    id: s.userId,
                    username: s.username,
                    socketId: s.id
                }));

                // Broadcast updated active users list
                io.to(projectId).emit('activeUsersUpdated', {
                    projectId,
                    users: activeUsers
                });
            }
        });

        /**
         * Leave a project room
         */
        socket.on('leaveProject', async (projectId) => {
            socket.leave(projectId);
            socket.activeRooms.delete(projectId);

            logger.info(`Socket ${socket.id} left project ${projectId}`);

            socket.emit('leftProject', { projectId });
            socket.to(projectId).emit('userLeft', {
                userId: socket.userId,
                projectId
            });

            // Get updated active users list for this project
            const socketsInRoom = await io.in(projectId).fetchSockets();
            const activeUsers = socketsInRoom.map(s => ({
                id: s.userId,
                username: s.username,
                socketId: s.id
            }));

            // Broadcast updated active users list
            io.to(projectId).emit('activeUsersUpdated', {
                projectId,
                users: activeUsers
            });
        });

        /**
         * Handle reconnection
         */
        socket.on('reconnect', () => {
            logger.info(`Client reconnected: ${socket.id}, User: ${socket.userId}`);
            socket.emit('reconnected', { socketId: socket.id });
        });

        /**
         * Heartbeat/ping for connection health
         */
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });
    });

    // Heartbeat mechanism
    const heartbeatInterval = setInterval(() => {
        io.emit('heartbeat', { timestamp: Date.now() });
    }, 30000); // Every 30 seconds

    // Cleanup on server shutdown
    process.on('SIGTERM', () => {
        clearInterval(heartbeatInterval);
    });

    logger.info('Socket.io handlers initialized');
}

module.exports = { initializeSocketHandlers };
