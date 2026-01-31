import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Logo from '../components/common/Logo';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!token) {
            setError('Reset token is missing. Please use the link from your email.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post<{ success: boolean; data?: { token: string; user: any }; message: string }>('/auth/reset-password', {
                token,
                newPassword,
            });

            if (response.success) {
                setIsSuccess(true);

                // Auto-login after successful reset
                if (response.data?.token && response.data?.user) {
                    login(response.data.user, response.data.token);                    // Redirect after 2 seconds
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
                            <p className="text-gray-400 mb-6">
                                Your password has been changed successfully. You are now logged in.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                Redirecting to home...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Logo className="justify-center mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Reset Your Password</h1>
                    <p className="text-gray-400">
                        Enter your new password below.
                    </p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
                    {!token ? (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Invalid Reset Link</h3>
                            <p className="text-gray-400 mb-6">
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <Link
                                to="/forgot-password"
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors"
                            >
                                Request New Link
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Enter new password"
                                        required
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Confirm new password"
                                        required
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        Reset Password
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
