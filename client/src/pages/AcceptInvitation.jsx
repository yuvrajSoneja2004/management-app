import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { acceptInvitation } from '../api/project';
import useAuthStore from '../store/authStore';
import { CheckCircle, XCircle, Loader2, LogIn } from 'lucide-react';

const AcceptInvitation = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [status, setStatus] = useState('checking'); // checking, login-required, loading, success, error
    const [message, setMessage] = useState('');
    const [projectData, setProjectData] = useState(null);

    useEffect(() => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            setStatus('login-required');
            return;
        }

        // User is authenticated, proceed with acceptance
        handleAccept();
    }, [token, isAuthenticated]);

    const handleAccept = async () => {
        setStatus('loading');
        try {
            const data = await acceptInvitation(token);
            setStatus('success');
            setMessage(data.message || 'Invitation accepted successfully!');
            setProjectData(data.project);
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to accept invitation');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-center">Project Invitation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {status === 'checking' && (
                        <>
                            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                            <p className="text-gray-600">Checking authentication...</p>
                        </>
                    )}

                    {status === 'login-required' && (
                        <>
                            <LogIn className="h-12 w-12 text-blue-500" />
                            <p className="text-center font-medium">Please login to accept this invitation</p>
                            <p className="text-sm text-gray-600 text-center">
                                You need to be logged in to accept project invitations. If you don't have an account, please register first.
                            </p>
                            <div className="flex gap-2 mt-4 w-full">
                                <Button
                                    onClick={() => navigate('/login', { state: { from: `/invitations/${token}/accept` } })}
                                    className="flex-1"
                                >
                                    Login
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/register', { state: { from: `/invitations/${token}/accept` } })}
                                    className="flex-1"
                                >
                                    Register
                                </Button>
                            </div>
                        </>
                    )}

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
                            {projectData && (
                                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg w-full">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <strong>Project:</strong> {projectData.name}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                        <strong>Your Role:</strong> {projectData.role}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2 mt-4">
                                <Button onClick={() => navigate(`/projects/${projectData._id}`)}>
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
                            <p className="text-center text-red-600 font-medium">{message}</p>
                            <p className="text-sm text-gray-600 text-center mt-2">
                                This invitation may have expired or already been used.
                            </p>
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
