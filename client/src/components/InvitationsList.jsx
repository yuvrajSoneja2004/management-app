import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Mail, Clock, Shield } from 'lucide-react';
import { getProjectInvitations, cancelInvitation } from '../api/project';

const InvitationsList = ({ projectId }) => {
    const [invitations, setInvitations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInvitations = async () => {
        try {
            const data = await getProjectInvitations(projectId);
            setInvitations(data);
        } catch (error) {
            console.error('Failed to fetch invitations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, [projectId]);

    const handleCancel = async (invitationId) => {
        try {
            await cancelInvitation(invitationId);
            setInvitations(invitations.filter(inv => inv._id !== invitationId));
        } catch (error) {
            console.error('Failed to cancel invitation:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) return <div className="text-sm text-gray-500">Loading invitations...</div>;
    if (invitations.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Pending Invitations
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {invitations.map((invitation) => (
                        <div
                            key={invitation._id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            <div className="flex-1">
                                <div className="font-medium text-sm">{invitation.email}</div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Shield className="h-3 w-3" />
                                        {invitation.role}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Expires {formatDate(invitation.expiresAt)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(invitation._id)}
                                className="ml-2"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default InvitationsList;
