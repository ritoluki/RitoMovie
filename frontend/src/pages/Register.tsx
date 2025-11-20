import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const validate = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name) {
      newErrors.name = t('auth.validation.nameRequired');
    } else if (name.length < 2) {
      newErrors.name = t('auth.validation.nameMinLength');
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.passwordsNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <Link to="/" className="block text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 font-display">
            RitoMovie
          </h1>
        </Link>

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-2">{t('auth.createAccount')}</h2>
          <p className="text-gray-400 mb-8">{t('auth.joinUs')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label={t('auth.fullName')}
              placeholder={t('auth.fullNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              autoComplete="name"
            />

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
              autoComplete="new-password"
            />

            <Input
              type="password"
              label={t('auth.confirmPassword')}
              placeholder={t('auth.passwordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                className="w-4 h-4 mt-1 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-600"
                required
              />
              <label className="ml-2 text-sm text-gray-300">
                {t('auth.agreeToTerms')}{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  {t('auth.termsOfService')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  {t('auth.privacyPolicy')}
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {t('auth.createAccountButton')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-500 font-semibold transition-colors"
              >
                {t('auth.signIn')}
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

export default Register;

