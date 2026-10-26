import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import GoogleLoginButton from '@/components/common/GoogleLoginButton';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LogoLink } from '@/components/common/Logo';
import TurnstileWidget from '@/components/common/TurnstileWidget';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to true
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [captchaError, setCaptchaError] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const from = (location.state as any)?.from?.pathname || '/';

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('auth.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.validation.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.validation.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.validation.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if ((import.meta.env.PROD || import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim()) && !turnstileToken) {
      setCaptchaError('Please complete the robot verification.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, rememberMe, turnstileToken || undefined);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
      setTurnstileResetKey((key) => key + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <LogoLink to="/" size="lg" animated={true} />
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-2">{t('auth.welcomeBack')}</h2>
          <p className="text-gray-400 mb-8">{t('auth.signInToContinue')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              type="password"
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-start justify-between gap-4">
              <label className="group flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                  aria-describedby="remember-me-description"
                />
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-gray-500 bg-gray-900/70 text-white shadow-sm transition-all group-hover:border-primary-500 peer-checked:border-primary-500 peer-checked:bg-primary-600 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-800">
                  {rememberMe && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-200">{t('auth.rememberMe')}</span>
                  <span id="remember-me-description" className="mt-0.5 block text-xs text-gray-500">{t('auth.rememberMeDescription')}</span>
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <div>
              <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
              {captchaError && !turnstileToken && (
                <p className="mt-1 text-xs text-red-300" role="alert">{captchaError}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {t('auth.signIn')}
            </Button>
          </form>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800/50 text-gray-400">Or continue with</span>
                </div>
              </div>

              <GoogleLoginButton
                onSuccess={() => navigate(from, { replace: true })}
              />
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {t('auth.dontHaveAccount')}{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-500 font-semibold transition-colors"
              >
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            {t('common.backToHome')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

