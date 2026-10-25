import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

interface RetryConfig extends InternalAxiosRequestConfig {
  externalApiRetryCount?: number;
}

const RETRYABLE_CODES = new Set([
  'ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'EAI_AGAIN', 'EPIPE',
]);
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const MAX_RETRIES = 2;

// Log only the destination and error code, never Axios config or API credentials.
export const describeExternalApiError = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  let destination = 'external API';
  try {
    const url = new URL(error.config?.url || '', error.config?.baseURL);
    destination = `${url.hostname}${url.pathname}`;
  } catch {
    // A malformed URL must not cause error logging to throw.
  }
  const reason = error.response ? `HTTP ${error.response.status}` : error.code || 'NETWORK_ERROR';
  return `${destination}: ${reason}`;
};

export const addExternalApiRetries = (client: AxiosInstance, name: string): void => {
  client.interceptors.response.use(undefined, async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) throw error;

    const config = error.config as RetryConfig;
    const method = config.method?.toLowerCase();
    const isRead = method === 'get' || method === 'head';
    const isTransient = error.response
      ? RETRYABLE_STATUSES.has(error.response.status)
      : RETRYABLE_CODES.has(error.code || '');
    const retries = config.externalApiRetryCount || 0;

    if (!isRead || !isTransient || retries >= MAX_RETRIES || config.signal?.aborted) {
      throw error;
    }

    config.externalApiRetryCount = retries + 1;
    const delay = 300 * 2 ** retries + Math.floor(Math.random() * 100);
    console.warn(`[${name}] ${describeExternalApiError(error)}; retry ${retries + 1}/${MAX_RETRIES}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return client.request(config);
  });
};
