import { useCallback } from 'react';
import useSocketStore from '../store/socketStore';

/**
 * Hook to manage task locking for preventing race conditions
 */
export const useTaskLock = (taskId, projectId) => {
    const requestTaskLock = useSocketStore((state) => state.requestTaskLock);
    const releaseTaskLock = useSocketStore((state) => state.releaseTaskLock);
    const isTaskLocked = useSocketStore((state) => state.isTaskLocked);

    const lockStatus = isTaskLocked(taskId);

    const requestLock = useCallback(() => {
        if (taskId && projectId) {
            requestTaskLock(taskId, projectId);
        }
    }, [taskId, projectId, requestTaskLock]);

    const releaseLock = useCallback(() => {
        if (taskId && projectId) {
            releaseTaskLock(taskId, projectId);
        }
    }, [taskId, projectId, releaseTaskLock]);

    return {
        isLocked: lockStatus.locked,
        isLockedByCurrentUser: lockStatus.byCurrentUser,
        lockedBy: lockStatus.lockedBy,
        requestLock,
        releaseLock,
    };
};

export default useTaskLock;
