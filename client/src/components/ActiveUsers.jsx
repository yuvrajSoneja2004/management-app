import { useState, useEffect } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Avatar from './Avatar';
import useSocketStore from '@/store/socketStore';

const ActiveUsers = ({ projectId }) => {
    const [activeUsers, setActiveUsers] = useState([]);
    const socket = useSocketStore((state) => state.socket);

    useEffect(() => {
        if (!socket || !projectId) return;

        // Listen for active users updates
        const handleActiveUsersUpdated = ({ users }) => {
            setActiveUsers(users || []);
        };

        const handleJoinedProject = ({ activeUsers: users }) => {
            setActiveUsers(users || []);
        };

        socket.on('activeUsersUpdated', handleActiveUsersUpdated);
        socket.on('joinedProject', handleJoinedProject);

        return () => {
            socket.off('activeUsersUpdated', handleActiveUsersUpdated);
            socket.off('joinedProject', handleJoinedProject);
        };
    }, [socket, projectId]);

    if (activeUsers.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {activeUsers.length} online
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <div className="p-2">
                    <h3 className="text-sm font-semibold mb-2 px-2">Active Users</h3>
                    <div className="space-y-1">
                        {activeUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <Avatar
                                    username={user.username}
                                    userId={user.id}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {user.username}
                                    </p>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                            </div>
                        ))}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ActiveUsers;
