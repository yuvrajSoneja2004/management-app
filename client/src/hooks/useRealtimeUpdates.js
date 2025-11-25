import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useSocketStore from '../store/socketStore';
import { baseApi } from '../store/api/baseApi';

/**
 * Hook to handle real-time updates via Socket.io
 * Invalidates RTK Query cache when receiving real-time events
 */
export const useRealtimeUpdates = (projectId) => {
    const dispatch = useDispatch();
    const socket = useSocketStore((state) => state.socket);
    const connected = useSocketStore((state) => state.connected);

    useEffect(() => {
        if (!socket || !connected || !projectId) return;

        // Task created
        const handleTaskCreated = (data) => {
            if (data.projectId === projectId) {
                // Invalidate tasks cache
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Tasks', id: `PROJECT-${projectId}` }])
                );
            }
        };

        // Task updated
        const handleTaskUpdated = (data) => {
            if (data.projectId === projectId) {
                // Invalidate specific task and project tasks
                dispatch(
                    baseApi.util.invalidateTags([
                        { type: 'Tasks', id: data.taskId },
                        { type: 'Tasks', id: `PROJECT-${projectId}` },
                    ])
                );
            }
        };

        // Task deleted
        const handleTaskDeleted = (data) => {
            if (data.projectId === projectId) {
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Tasks', id: `PROJECT-${projectId}` }])
                );
            }
        };

        // Project updated
        const handleProjectUpdated = (data) => {
            if (data.projectId === projectId) {
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Projects', id: projectId }])
                );
            }
        };

        // File uploaded
        const handleFileUploaded = (data) => {
            if (data.projectId === projectId) {
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Tasks', id: data.taskId }])
                );
            }
        };

        // Register event listeners
        socket.on('taskCreated', handleTaskCreated);
        socket.on('taskUpdated', handleTaskUpdated);
        socket.on('taskDeleted', handleTaskDeleted);
        socket.on('projectUpdated', handleProjectUpdated);
        socket.on('fileUploaded', handleFileUploaded);

        // Cleanup
        return () => {
            socket.off('taskCreated', handleTaskCreated);
            socket.off('taskUpdated', handleTaskUpdated);
            socket.off('taskDeleted', handleTaskDeleted);
            socket.off('projectUpdated', handleProjectUpdated);
            socket.off('fileUploaded', handleFileUploaded);
        };
    }, [socket, connected, projectId, dispatch]);
};

export default useRealtimeUpdates;
