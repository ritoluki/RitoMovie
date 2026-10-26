import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/common/Logo';
import TurnstileWidget from '@/components/common/TurnstileWidget';
import api from '@/lib/axios';

const VerifyEmailPending = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(() => {
    const wait = Number(searchParams.get('wait') || 0);
    return Number.isFinite(wait) ? Math.max(0, wait) : 0;
  });
  const [hasSent, setHasSent] = useState(searchParams.get('sent') === '1');
  const [initialSendFailed] = useState(searchParams.get('sent') === '0');
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if ((import.meta.env.PROD || import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim()) && !turnstileToken) {
      setError(t('auth.completeRobotVerification'));
      return;
    }

    setIsSending(true);
    try {
      const response = await api.post<{
        success: boolean;
        data?: { retryAfterSeconds?: number };
      }>('/auth/resend-verification', { email, turnstileToken });
      setHasSent(true);
      setResendCooldown(Math.max(0, response.data?.retryAfterSeconds || 60));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || String(requestError));
    } finally {
      setIsSending(false);
      setTurnstileToken('');
      setResetKey((key) => key + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="justify-center" />
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/60 p-8 shadow-2xl backdrop-blur-lg">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/15">
              {hasSent
                ? <CheckCircle className="size-8 text-green-400" />
                : <Mail className="size-8 text-primary" />}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">{t('auth.verifyEmailTitle')}</h1>
            <p className="text-sm leading-6 text-gray-400">
              {hasSent
                ? t('auth.verificationEmailSentHint')
                : initialSendFailed
                  ? t('auth.verificationInitialEmailFailed')
                  : t('auth.verifyEmailDescription')}
            </p>
          </div>

          <form onSubmit={handleResend} className="space-y-5">
            <div>
              <label htmlFor="verification-email" className="mb-2 block text-sm font-medium text-gray-300">
                {t('auth.email')}
              </label>
              <input
                id="verification-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="h-11 w-full rounded-xl border border-gray-600 bg-gray-900/60 px-4 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={resetKey} />

            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={isSending || resendCooldown > 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending
                ? t('common.loading')
                : resendCooldown > 0
                  ? t('auth.resendVerificationCountdown', { seconds: resendCooldown })
                  : t('auth.resendVerificationEmail')}
            </button>
          </form>

          <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400 transition hover:text-white">
            <ArrowLeft className="size-4" />
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPending;
