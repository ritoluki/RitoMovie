import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppRoutes from './routes';
import ScrollToTop from './components/common/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';
import DocumentHead from './components/common/DocumentHead';
import ApiStatus from './components/common/ApiStatus';
import './i18n/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      retry: 1, // Retry failed requests once
      staleTime: 30 * 60 * 1000, // 30 minutes - data stays fresh longer
      gcTime: 60 * 60 * 1000, // 1 hour - keep cached data in memory longer
      refetchOnReconnect: true, // Refetch on network reconnect
      refetchOnMount: false, // Don't refetch if data is already cached
    },
  },
});
// Admin data changes frequently; catalog metadata keeps its existing long cache lifetime.
queryClient.setQueryDefaults(['admin'], {
  staleTime: 30_000,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
});

function EmailVerificationPromptListener() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleVerificationRequired = (event: Event) => {
      const email = (event as CustomEvent<{ email?: string }>).detail?.email;
      toast.custom((toastItem) => (
        <div className="w-full max-w-sm rounded-xl border border-amber-500/30 bg-gray-900 p-4 text-white shadow-xl">
          <p className="text-sm leading-5">
            {t('auth.verifyToInteractPrompt', {
              defaultValue: i18n.language.startsWith('vi')
                ? 'Hãy xác minh email để bình luận hoặc đánh giá phim. Bạn vẫn có thể tiếp tục xem phim.'
                : 'Verify your email to comment or rate movies. You can keep watching while you do.',
            })}
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-primary-300 transition hover:text-primary-200"
            onClick={() => {
              toast.dismiss(toastItem);
              const query = email ? `?email=${encodeURIComponent(email)}` : '';
              navigate(`/verify-email-pending${query}`);
            }}
          >
            {t('auth.verifyEmailAction', { defaultValue: i18n.language.startsWith('vi') ? 'Xác minh email' : 'Verify email' })}
          </button>
        </div>
      ), { duration: 8000 });
    };

    window.addEventListener('email-verification-required', handleVerificationRequired);
    return () => window.removeEventListener('email-verification-required', handleVerificationRequired);
  }, [navigate, t]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DocumentHead />
        <ScrollToTop />
        <EmailVerificationPromptListener />
        <AppRoutes />
        <ApiStatus />
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          visibleToasts={4}
          duration={3500}
          toastOptions={{
            style: {
              borderRadius: '14px',
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

