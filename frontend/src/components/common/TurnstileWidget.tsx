import { useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | undefined;

const loadTurnstile = (): Promise<void> => {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    );
    const script = existing || document.createElement('script');

    const handleLoad = () => {
      if (window.turnstile) resolve();
      else {
        script.remove();
        reject(new Error('Turnstile failed to initialize.'));
      }
    };
    const handleError = () => {
      script.remove();
      reject(new Error('Turnstile script failed to load.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    scriptPromise = undefined;
    throw error;
  });

  return scriptPromise;
};

interface TurnstileWidgetProps {
  onTokenChange: (token: string) => void;
  resetKey: number;
}

const TurnstileWidget = ({ onTokenChange, resetKey }: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    onTokenChange('');
    setLoadError(false);
    if (!siteKey || !containerRef.current) return;

    let widgetId: string | undefined;
    let disposed = false;

    loadTurnstile()
      .then(() => {
        if (disposed || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: onTokenChange,
          'expired-callback': () => onTokenChange(''),
          'error-callback': () => {
            onTokenChange('');
            setLoadError(true);
          },
        });
      })
      .catch(() => {
        if (!disposed) setLoadError(true);
      });

    return () => {
      disposed = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, resetKey, onTokenChange]);

  if (!siteKey) {
    return import.meta.env.PROD ? (
      <p className="text-xs text-amber-300" role="status">
        Robot verification is temporarily unavailable. Please try again later.
      </p>
    ) : null;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="min-h-[66px]" />
      {loadError && (
        <p className="text-xs text-red-300" role="alert">
          Could not load robot verification. Check your connection and try again.
        </p>
      )}
    </div>
  );
};

export default TurnstileWidget;
