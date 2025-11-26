import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

const ResetPassword = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(resetPasswordSchema)
    });

    useEffect(() => {
        // Verify token on mount
        const verifyToken = async () => {
            try {
                await api.get(`/auth/verify-reset-token/${token}`);
                setTokenValid(true);
            } catch (error) {
                setTokenValid(false);
                toast.error('Invalid or expired reset link');
            } finally {
                setIsVerifying(false);
            }
        };

        if (token) {
            verifyToken();
        }
    }, [token]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await api.post(`/auth/reset-password/${token}`, {
                password: data.password
            });
            setResetSuccess(true);
            toast.success('Password reset successful!');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            toast.error('Error', {
                description: error.response?.data?.message || 'Failed to reset password'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Verifying reset link...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Invalid Reset Link</h3>
                                <p className="text-sm text-muted-foreground">
                                    This password reset link is invalid or has expired.
                                    Please request a new one.
                                </p>
                            </div>
                            <Button onClick={() => navigate('/forgot-password')} className="w-full">
                                Request New Link
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {resetSuccess ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Password Reset!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your password has been successfully reset.
                                    Redirecting to login...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter new password"
                                    {...register('password')}
                                    className={errors.password ? 'border-red-500' : ''}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    {...register('confirmPassword')}
                                    className={errors.confirmPassword ? 'border-red-500' : ''}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;
