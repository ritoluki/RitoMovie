import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Logo from '../components/common/Logo';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login, user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setIsLoading(false);
      setError('Verification token is missing.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.get<{ success: boolean; data?: { token: string; user: any }; message: string }>(`/auth/verify-email/${verificationToken}`);

      if (response.success) {
        setIsSuccess(true);

        // Auto-login after successful verification
        if (response.data?.token && response.data?.user) {
          login(response.data.user, response.data.token);          // Redirect after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify email. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await api.post<{ success: boolean; message: string }>('/auth/resend-verification');

      if (response.success) {
        alert('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
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
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Your Email</h2>
              <p className="text-gray-400">Please wait while we verify your email address...</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified Successfully!</h2>
              <p className="text-gray-400 mb-6">
                Your email has been verified. Welcome to RitoMovie!
              </p>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-300">
                  ✨ You can now enjoy all features of RitoMovie, including personalized recommendations and watchlist!
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Redirecting to home in 3 seconds...
              </div>

              <button
                onClick={() => navigate('/')}
                className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                Skip waiting
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
          <h1 className="text-3xl font-bold text-white mb-2">Email Verification</h1>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <p className="text-gray-400 mb-6">
              The verification link may have expired or is invalid. You can request a new verification email.
            </p>

            {user && !user.isEmailVerified ? (
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Resend Verification Email
                    </>
                  )}
                </button>

                <Link
                  to="/"
                  className="block text-center text-gray-400 hover:text-white transition-colors py-2"
                >
                  Go to Home
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Go to Login
                </Link>
                <Link
                  to="/register"
                  className="block text-center text-gray-400 hover:text-white transition-colors py-2"
                >
                  Create New Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
