import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Logo from '../components/common/Logo';
import api from '../lib/axios';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });

            if (response.success) {
                setIsSuccess(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }; if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                            <p className="text-gray-400">
                                If an account exists with <span className="text-white font-medium">{email}</span>,
                                you will receive a password reset link shortly.
                            </p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-300">
                                <strong>Note:</strong> The reset link will expire in 1 hour.
                                Please check your spam folder if you don't see the email.
                            </p>
                        </div>

                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
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
                    <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                    <p className="text-gray-400">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="your@email.com"
                                    required
                                    disabled={isLoading}
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
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-5 h-5" />
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

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

                <p className="text-center text-gray-500 text-sm mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary hover:text-primary/80 transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
