import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useSocketStore from '../store/socketStore';
import { baseApi } from '../store/api/baseApi';
import useAuthStore from '../store/authStore';
import { toast } from 'sonner';
import { playNotificationSound } from '../utils/audioUtils';

/**
 * Hook to handle real-time updates via Socket.io
 * Invalidates RTK Query cache when receiving real-time events
 */
export const useRealtimeUpdates = (projectId) => {
    const dispatch = useDispatch();
    const socket = useSocketStore((state) => state.socket);
    const connected = useSocketStore((state) => state.connected);
    const { user } = useAuthStore();

    useEffect(() => {
        console.log('[Real-time] useRealtimeUpdates effect running', { socket: !!socket, connected, projectId });

        if (!socket || !connected || !projectId) {
            console.log('[Real-time] Early return - missing dependencies');
            return;
        }

        // Join the project room for real-time updates
        console.log('[Real-time] Emitting joinProject for:', projectId);
        socket.emit('joinProject', projectId);

        // Helper to extract project ID from various payload shapes
        const getProjectId = (data) => {
            if (data.projectId) return String(data.projectId);
            if (typeof data.project === 'string') return data.project;
            if (data.project && data.project._id) return String(data.project._id);
            return null;
        };

        // Task created
        const handleTaskCreated = (data) => {
            console.log('[Real-time] taskCreated event received:', data);
            const pId = getProjectId(data);
            console.log('[Real-time] Extracted project ID:', pId, 'Current:', projectId);
            if (pId === projectId) {
                console.log('[Real-time] Invalidating cache for taskCreated');
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Tasks', id: `PROJECT-${projectId}` }])
                );
            }
        };

        // Task updated
        const handleTaskUpdated = (data) => {
            console.log('[Real-time] ✨ taskUpdated event received:', data);
            const pId = getProjectId(data);
            console.log('[Real-time] ✨ Extracted project ID:', pId, 'Current:', projectId, 'Match:', pId === projectId);
            if (pId === projectId) {
                console.log('[Real-time] ✨ INVALIDATING CACHE for taskUpdated');
                dispatch(
                    baseApi.util.invalidateTags([
                        { type: 'Tasks', id: data._id || data.taskId },
                        { type: 'Tasks', id: `PROJECT-${projectId}` },
                    ])
                );
            } else {
                console.log('[Real-time] ✨ PROJECT MISMATCH - NOT invalidating cache');
            }
        };

        // Task deleted
        const handleTaskDeleted = (data) => {
            console.log('[Real-time] taskDeleted event received:', data);
            const pId = getProjectId(data);
            if (pId === projectId) {
                console.log('[Real-time] Invalidating cache for taskDeleted');
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Tasks', id: `PROJECT-${projectId}` }])
                );
            }
        };

        // Project updated
        const handleProjectUpdated = (data) => {
            console.log('[Real-time] projectUpdated event received:', data);
            const pId = data._id || data.id || data.projectId;
            if (pId === projectId) {
                console.log('[Real-time] Invalidating cache for projectUpdated');
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Projects', id: projectId }])
                );
            }
        };

        // File uploaded
        const handleFileUploaded = (data) => {
            console.log('[Real-time] fileUploaded event received:', data);
            const pId = getProjectId(data);
            if (pId === projectId) {
                console.log('[Real-time] Invalidating cache for fileUploaded');
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Tasks', id: data.taskId }])
                );
            }
        };

        // User joined project - show notification with sound
        const handleUserJoined = (data) => {
            console.log('[Real-time] userJoined event received:', data);
            // Don't notify if it's the current user
            if (data.user && data.user.id !== user?._id) {
                // Play notification sound
                playNotificationSound();

                // Show toast notification
                toast.success(`${data.user.username} has joined ${data.projectName}`, {
                    duration: 4000,
                });
            }
        };

        // Register listeners
        console.log('[Real-time] Registering socket event listeners');
        socket.on('taskCreated', handleTaskCreated);
        socket.on('taskUpdated', handleTaskUpdated);
        socket.on('taskDeleted', handleTaskDeleted);
        socket.on('projectUpdated', handleProjectUpdated);
        socket.on('fileUploaded', handleFileUploaded);
        socket.on('userJoined', handleUserJoined);

        // Handle real-time notifications
        socket.on('notification', async (notification) => {
            console.log('[Real-time] 🔔 Notification received:', notification);

            // Play sound
            try {
                const audio = new Audio('/src/assets/sfx/notification_sound.mp3');
                await audio.play();
            } catch (error) {
                console.error('Error playing notification sound:', error);
            }

            // Show toast
            toast(notification.message, {
                icon: '🔔',
                duration: 5000,
            });

            // Invalidate notifications cache
            dispatch(baseApi.util.invalidateTags(['Notifications']));
        });

        // Cleanup on unmount
        return () => {
            console.log('[Real-time] Cleaning up - leaving project:', projectId);
            socket.emit('leaveProject', projectId);
            socket.off('taskCreated', handleTaskCreated);
            socket.off('taskUpdated', handleTaskUpdated);
            socket.off('taskDeleted', handleTaskDeleted);
            socket.off('projectUpdated', handleProjectUpdated);
            socket.off('fileUploaded', handleFileUploaded);
            socket.off('userJoined', handleUserJoined);
        };
    }, [socket, connected, projectId, dispatch, user]);
};

export default useRealtimeUpdates;
