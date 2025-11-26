import { create } from 'zustand';
import { io } from 'socket.io-client';

const useSocketStore = create((set, get) => ({
    socket: null,
    connected: false,
    reconnecting: false,
    activeRooms: new Set(),
    taskLocks: {}, // { taskId: { userId, expiresAt } }
    typingUsers: {}, // { taskId: [userId1, userId2] }

    // Initialize socket connection
    connect: (token) => {
        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://apiJello.yuvrajsoneja.in', {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        // Connection events
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            set({ connected: true, reconnecting: false });
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            set({ connected: false });
        });

        socket.on('reconnect_attempt', () => {
            set({ reconnecting: true });
        });

        socket.on('reconnected', () => {
            console.log('Socket reconnected');
            set({ reconnecting: false });

            // Rejoin all active rooms
            const { activeRooms } = get();
            activeRooms.forEach((projectId) => {
                socket.emit('joinProject', projectId);
            });
        });

        // Task lock events
        socket.on('taskLockAcquired', ({ taskId }) => {
            set((state) => ({
                taskLocks: {
                    ...state.taskLocks,
                    [taskId]: { locked: true, byCurrentUser: true },
                },
            }));
        });

        socket.on('taskLockDenied', ({ taskId, lockedBy }) => {
            set((state) => ({
                taskLocks: {
                    ...state.taskLocks,
                    [taskId]: { locked: true, byCurrentUser: false, lockedBy },
                },
            }));
        });

        socket.on('taskLocked', ({ taskId, userId }) => {
            set((state) => ({
                taskLocks: {
                    ...state.taskLocks,
                    [taskId]: { locked: true, byCurrentUser: false, lockedBy: userId },
                },
            }));
        });

        socket.on('taskUnlocked', ({ taskId }) => {
            set((state) => {
                const newLocks = { ...state.taskLocks };
                delete newLocks[taskId];
                return { taskLocks: newLocks };
            });
        });

        // Typing indicators
        socket.on('userTaskTyping', ({ taskId, userId, isTyping }) => {
            set((state) => {
                const typingUsers = { ...state.typingUsers };
                if (isTyping) {
                    typingUsers[taskId] = [...(typingUsers[taskId] || []), userId];
                } else {
                    typingUsers[taskId] = (typingUsers[taskId] || []).filter((id) => id !== userId);
                }
                return { typingUsers };
            });
        });

        set({ socket });
    },

    // Disconnect socket
    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, connected: false, activeRooms: new Set(), taskLocks: {}, typingUsers: {} });
        }
    },

    // Join project room
    joinProject: (projectId) => {
        const { socket, activeRooms } = get();
        if (socket && socket.connected) {
            socket.emit('joinProject', projectId);
            activeRooms.add(projectId);
            set({ activeRooms: new Set(activeRooms) });
        }
    },

    // Leave project room
    leaveProject: (projectId) => {
        const { socket, activeRooms } = get();
        if (socket && socket.connected) {
            socket.emit('leaveProject', projectId);
            activeRooms.delete(projectId);
            set({ activeRooms: new Set(activeRooms) });
        }
    },

    // Request task lock
    requestTaskLock: (taskId, projectId) => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.emit('requestTaskLock', { taskId, projectId });
        }
    },

    // Release task lock
    releaseTaskLock: (taskId, projectId) => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.emit('releaseTaskLock', { taskId, projectId });
        }
    },

    // Emit typing indicator
    emitTyping: (taskId, projectId, isTyping) => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.emit('taskTyping', { taskId, projectId, isTyping });
        }
    },

    // Get task lock status
    isTaskLocked: (taskId) => {
        const { taskLocks } = get();
        return taskLocks[taskId] || { locked: false };
    },

    // Get typing users for task
    getTypingUsers: (taskId) => {
        const { typingUsers } = get();
        return typingUsers[taskId] || [];
    },
}));

export default useSocketStore;
