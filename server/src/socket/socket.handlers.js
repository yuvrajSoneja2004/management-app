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
                const project = await projectRepository.findById(projectId);

                if (!project) {
                    socket.emit('error', { message: 'Project not found' });
                    return;
                }

                const isMember = project.members.some(
                    m => m.user.toString() === socket.userId.toString()
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

                // Notify user
                socket.emit('joinedProject', { projectId });

                // Notify other members
                socket.to(projectId).emit('userJoined', {
                    userId: socket.userId,
                    projectId
                });
            } catch (error) {
                logger.error(`Error joining project: ${error.message}`);
                socket.emit('error', { message: 'Failed to join project' });
            }
        });

        /**
         * Leave a project room
         */
        socket.on('leaveProject', (projectId) => {
            socket.leave(projectId);
            socket.activeRooms.delete(projectId);

            logger.info(`Socket ${socket.id} left project ${projectId}`);

            socket.emit('leftProject', { projectId });
            socket.to(projectId).emit('userLeft', {
                userId: socket.userId,
                projectId
            });
        });

        /**
         * Request task lock for editing
         */
        socket.on('requestTaskLock', ({ taskId, projectId }) => {
            const acquired = taskLockManager.acquireLock(taskId, socket.userId);

            if (acquired) {
                socket.emit('taskLockAcquired', { taskId });
                // Notify others in the project
                socket.to(projectId).emit('taskLocked', {
                    taskId,
                    userId: socket.userId
                });
                logger.info(`Task lock acquired: Task ${taskId}, User ${socket.userId}`);
            } else {
                const lockInfo = taskLockManager.isLocked(taskId);
                socket.emit('taskLockDenied', {
                    taskId,
                    lockedBy: lockInfo?.userId,
                    expiresIn: lockInfo?.expiresIn
                });
                logger.info(`Task lock denied: Task ${taskId}, User ${socket.userId}`);
            }
        });

        /**
         * Release task lock
         */
        socket.on('releaseTaskLock', ({ taskId, projectId }) => {
            const released = taskLockManager.releaseLock(taskId, socket.userId);

            if (released) {
                socket.emit('taskLockReleased', { taskId });
                socket.to(projectId).emit('taskUnlocked', { taskId });
                logger.info(`Task lock released: Task ${taskId}, User ${socket.userId}`);
            }
        });

        /**
         * Extend task lock (keep-alive)
         */
        socket.on('extendTaskLock', ({ taskId }) => {
            const extended = taskLockManager.extendLock(taskId, socket.userId);

            if (extended) {
                socket.emit('taskLockExtended', { taskId });
            } else {
                socket.emit('taskLockExpired', { taskId });
            }
        });

        /**
         * Typing indicator for tasks
         */
        socket.on('taskTyping', ({ taskId, projectId, isTyping }) => {
            socket.to(projectId).emit('userTaskTyping', {
                taskId,
                userId: socket.userId,
                isTyping
            });
        });

        /**
         * Handle disconnection
         */
        socket.on('disconnect', () => {
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

            // Notify rooms about user disconnect
            for (const projectId of socket.activeRooms) {
                socket.to(projectId).emit('userDisconnected', {
                    userId: socket.userId,
                    projectId
                });
            }
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
