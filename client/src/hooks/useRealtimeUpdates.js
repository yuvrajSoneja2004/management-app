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

        // Join the project room for real-time updates
        socket.emit('joinProject', projectId);

        // Helper to extract project ID from various payload shapes
        const getProjectId = (data) => {
            if (data.projectId) return data.projectId;
            if (typeof data.project === 'string') return data.project;
            if (data.project && data.project._id) return data.project._id;
            return null;
        };

        // Task created
        const handleTaskCreated = (data) => {
            const pId = getProjectId(data);
            if (pId === projectId) {
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Tasks', id: `PROJECT-${projectId}` }])
                );
            }
        };

        // Task updated
        const handleTaskUpdated = (data) => {
            const pId = getProjectId(data);
            if (pId === projectId) {
                dispatch(
                    baseApi.util.invalidateTags([
                        { type: 'Tasks', id: data._id || data.taskId },
                        { type: 'Tasks', id: `PROJECT-${projectId}` },
                    ])
                );
            }
        };

        // Task deleted
        const handleTaskDeleted = (data) => {
            const pId = getProjectId(data);
            if (pId === projectId) {
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Tasks', id: `PROJECT-${projectId}` }])
                );
            }
        };

        // Project updated
        const handleProjectUpdated = (data) => {
            const pId = data._id || data.id || data.projectId;
            if (pId === projectId) {
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Projects', id: projectId }])
                );
            }
        };

        // File uploaded
        const handleFileUploaded = (data) => {
            const pId = getProjectId(data);
            if (pId === projectId) {
                dispatch(
                    baseApi.util.invalidateTags([{ type: 'Files', id: data.taskId }])
                );
            }
        };

        // Register listeners
        socket.on('taskCreated', handleTaskCreated);
        socket.on('taskUpdated', handleTaskUpdated);
        socket.on('taskDeleted', handleTaskDeleted);
        socket.on('projectUpdated', handleProjectUpdated);
        socket.on('fileUploaded', handleFileUploaded);

        // Cleanup on unmount
        return () => {
            socket.emit('leaveProject', projectId);
            socket.off('taskCreated', handleTaskCreated);
            socket.off('taskUpdated', handleTaskUpdated);
            socket.off('taskDeleted', handleTaskDeleted);
            socket.off('projectUpdated', handleProjectUpdated);
            socket.off('fileUploaded', handleFileUploaded);
        };
    }, [socket, connected, projectId, dispatch]);
};

export default useRealtimeUpdates;
