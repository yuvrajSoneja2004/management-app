import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, UserPlus, FileEdit, Trash2, Mail, CheckCircle } from 'lucide-react';
import { getProjectActivities } from '../api/project';

const ActivityFeed = ({ projectId }) => {
    const [activities, setActivities] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchActivities = async (pageNum = 1) => {
        setIsLoading(true);
        try {
            const data = await getProjectActivities(projectId, pageNum);
            setActivities(data.activities);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(page);
    }, [projectId, page]);

    const getActivityIcon = (action) => {
        switch (action) {
            case 'task_created':
            case 'project_created':
                return <FileEdit className="h-4 w-4 text-blue-500" />;
            case 'task_updated':
            case 'project_updated':
                return <FileEdit className="h-4 w-4 text-yellow-500" />;
            case 'task_deleted':
                return <Trash2 className="h-4 w-4 text-red-500" />;
            case 'member_added':
                return <UserPlus className="h-4 w-4 text-green-500" />;
            case 'invitation_sent':
                return <Mail className="h-4 w-4 text-purple-500" />;
            case 'invitation_accepted':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getActivityText = (activity) => {
        const user = activity.user?.username || 'Someone';

        switch (activity.action) {
            case 'task_created':
                return `${user} created task "${activity.metadata.taskTitle}"`;
            case 'task_updated':
                return `${user} updated task "${activity.metadata.taskTitle}"`;
            case 'task_deleted':
                return `${user} deleted a task`;
            case 'member_added':
                return `${user} added ${activity.metadata.memberEmail} as ${activity.metadata.memberRole}`;
            case 'project_created':
                return `${user} created the project`;
            case 'project_updated':
                return `${user} updated project settings`;
            case 'invitation_sent':
                return `${user} invited ${activity.metadata.invitedEmail}`;
            case 'invitation_accepted':
                return `${user} accepted the invitation`;
            default:
                return `${user} performed an action`;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (isLoading && activities.length === 0) {
        return <div className="text-sm text-gray-500">Loading activities...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Feed
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No activities yet</p>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity) => (
                            <div key={activity._id} className="flex gap-3 items-start">
                                <div className="mt-0.5">{getActivityIcon(activity.action)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">{getActivityText(activity)}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTime(activity.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {pagination && pagination.pages > 1 && (
                            <div className="flex justify-between items-center pt-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-600">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === pagination.pages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ActivityFeed;
