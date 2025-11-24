import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { acceptInvitation } from '../api/project';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AcceptInvitation = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const [projectId, setProjectId] = useState(null);

    useEffect(() => {
        const handleAccept = async () => {
            try {
                const data = await acceptInvitation(token);
                setStatus('success');
                setMessage(data.message || 'Invitation accepted successfully!');
                setProjectId(data.project._id);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Failed to accept invitation');
            }
        };

        handleAccept();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-center">Project Invitation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                            <p className="text-gray-600">Processing invitation...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <p className="text-center font-medium">{message}</p>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={() => navigate(`/projects/${projectId}`)}>
                                    Go to Project
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/')}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="h-12 w-12 text-red-500" />
                            <p className="text-center text-red-600">{message}</p>
                            <Button onClick={() => navigate('/')} className="mt-4">
                                Go to Dashboard
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AcceptInvitation;
