import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address')
});

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await api.post('/auth/forgot-password', data);
            setEmailSent(true);
            toast.success('Reset link sent!', {
                description: 'Check your email for password reset instructions'
            });
        } catch (error) {
            toast.error('Error', {
                description: error.response?.data?.message || 'Failed to send reset email'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/login')}
                            className="gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Button>
                    </div>
                    <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {emailSent ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Check your email</h3>
                                <p className="text-sm text-muted-foreground">
                                    We've sent password reset instructions to your email address.
                                    The link will expire in 1 hour.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/login')}
                                className="w-full"
                            >
                                Return to Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    {...register('email')}
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
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
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <div className="text-center text-sm">
                                <Link to="/login" className="text-primary hover:underline">
                                    Remember your password? Sign in
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;
