import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

interface GoogleLoginButtonProps {
    onSuccess?: () => void;
    onError?: () => void;
}

const GoogleLoginButton = ({ onSuccess, onError }: GoogleLoginButtonProps) => {
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuthStore();
    const { t } = useTranslation();

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Create credential format that backend expects
                const credential = tokenResponse.access_token;

                await loginWithGoogle(credential);
                onSuccess?.();
                navigate('/');
            } catch (error) {
                console.error('Google login error:', error);
                toast.error(t('auth.googleLoginFailed') || 'Failed to login with Google');
                onError?.();
            }
        },
        onError: () => {
            console.error('Google login failed');
            toast.error(t('auth.googleLoginFailed') || 'Google login failed');
            onError?.();
        },
    });

    return (
        <button
            onClick={() => login()}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-lg border-2 border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
        >
            <FcGoogle className="text-2xl" />
            <span>{t('auth.signInWithGoogle')}</span>
        </button>
    );
};

export default GoogleLoginButton;
