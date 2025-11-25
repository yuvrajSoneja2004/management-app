import { useEffect } from 'react';
import useSocketStore from '../store/socketStore';
import useAuthStore from '../store/authStore';

/**
 * Hook to initialize and manage Socket.io connection
 */
export const useSocket = () => {
    const token = useAuthStore((state) => state.token);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const connect = useSocketStore((state) => state.connect);
    const disconnect = useSocketStore((state) => state.disconnect);
    const socket = useSocketStore((state) => state.socket);
    const connected = useSocketStore((state) => state.connected);

    useEffect(() => {
        if (isAuthenticated && token && !socket) {
            // Connect socket
            connect(token);
        } else if (!isAuthenticated && socket) {
            // Disconnect socket on logout
            disconnect();
        }

        // Cleanup on unmount
        return () => {
            if (socket) {
                disconnect();
            }
        };
    }, [isAuthenticated, token, socket, connect, disconnect]);

    return {
        socket,
        connected,
        isReconnecting: useSocketStore((state) => state.reconnecting),
    };
};

export default useSocket;
