import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Logo from '../components/common/Logo';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const requestedToken = useRef<string>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && requestedToken.current !== token) {
      requestedToken.current = token;
      verifyEmail(token);
    } else if (!token) {
      setIsLoading(false);
      setError('Verification token is missing.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.get<{
        success: boolean;
        data?: { email: string; isEmailVerified: boolean };
        message: string;
      }>(`/auth/verify-email/${verificationToken}`);

      if (response.success) {
        setIsSuccess(true);

        // Verification must never create or replace the current session.
        // Update the local flag only if the current session belongs to this email.
        const currentUser = useAuthStore.getState().user;
        if (
          currentUser &&
          response.data?.email &&
          currentUser.email.toLowerCase() === response.data.email.toLowerCase()
        ) {
          const updatedUser = { ...currentUser, isEmailVerified: response.data.isEmailVerified };
          useAuthStore.setState({
            user: updatedUser,
          });
          const storedSessionUser = sessionStorage.getItem('auth-user');
          if (storedSessionUser) {
            try {
              const sessionUser = JSON.parse(storedSessionUser);
              if (sessionUser.email?.toLowerCase() === response.data.email.toLowerCase()) {
                sessionStorage.setItem('auth-user', JSON.stringify(updatedUser));
              }
            } catch {
              sessionStorage.removeItem('auth-user');
            }
          }
        }
      }
    } catch (err: any) {
      setError(
        typeof err === 'string'
          ? err
          : err.message || 'Failed to verify email. The link may have expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your email address...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-400 mb-6">
                Your email has been verified. Your current signed-in account has not been changed.
              </p>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-300">
                  ✨ You can now enjoy all features of RitoMovie, including
                  personalized recommendations and watchlist!
                </p>
              </div>

              <button
                onClick={() => navigate('/')}
                className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                Go to home
                <ArrowRight className="w-4 h-4" />
              </button>
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
          <h1 className="text-3xl font-bold text-white mb-2">
            Email Verification
          </h1>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Verification Failed
            </h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <p className="text-gray-400 mb-6">
              The verification link may have expired or is invalid. You can
              request a new verification email.
            </p>

            <div className="space-y-3">
              <Link
                to="/verify-email-pending"
                className="block w-full rounded-lg bg-primary py-3 text-center font-medium text-white transition-colors hover:bg-primary/90"
              >
                Request a new verification email
              </Link>
              <Link to="/login" className="block py-2 text-center text-gray-400 transition-colors hover:text-white">
                Go to Login
              </Link>
              <Link to="/register" className="block py-2 text-center text-gray-400 transition-colors hover:text-white">
                Create New Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
