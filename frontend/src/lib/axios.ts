import axios from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import { beginApiRequest } from './apiActivity';

type TrackedConfig = import('axios').InternalAxiosRequestConfig & {
  finishActivity?: () => void;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 70000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    (config as TrackedConfig).finishActivity = beginApiRequest();
    // First check sessionStorage (for non-remember-me sessions)
    const sessionToken = sessionStorage.getItem('auth-token');
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    } else {
      // Then check localStorage (for remember-me sessions)
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          const token = state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
    }

    // Add Accept-Language header for i18n
    const language = localStorage.getItem('i18nextLng') || 'en';
    config.headers['Accept-Language'] = language;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    (response.config as TrackedConfig).finishActivity?.();
    // The API response structure is: { success: true, data: {...}, message: '...' }
    // Return the response data directly (which includes success, data, message)
    return response.data;
  },
  (error) => {
    (error.config as TrackedConfig | undefined)?.finishActivity?.();
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - only redirect if not already on login/register page
        // This prevents redirect loops during login attempts
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes('/login') &&
          !currentPath.includes('/register')
        ) {
          localStorage.removeItem('auth-storage');
          sessionStorage.removeItem('auth-token');
          sessionStorage.removeItem('auth-user');
          window.location.href = '/login';
        }
      }

      // Extract error message from response
      // API error response structure: { success: false, message: '...', errors: [...] }
      let errorMessage = data?.message || error.message || 'An error occurred';

      if (data?.code === 'MOVIE_UNAVAILABLE') {
        return Promise.reject(Object.assign(new Error(errorMessage), {
          code: 'MOVIE_UNAVAILABLE',
          response: error.response,
        }));
      }

      if (status === 403 && data?.code === 'EMAIL_VERIFICATION_REQUIRED') {
        window.dispatchEvent(new CustomEvent('email-verification-required', {
          detail: { email: data.email },
        }));
        const verificationError = Object.assign(new Error(errorMessage), {
          code: 'EMAIL_VERIFICATION_REQUIRED',
          response: error.response,
        });
        return Promise.reject(verificationError);
      }

      // If validation errors exist, append the first error detail
      if (
        data?.errors &&
        Array.isArray(data.errors) &&
        data.errors.length > 0
      ) {
        const firstError = data.errors[0];
        if (firstError.field && firstError.message) {
          errorMessage = `${firstError.field}: ${firstError.message}`;
        } else if (firstError.message) {
          errorMessage = firstError.message;
        }
      }

      return Promise.reject(Object.assign(new Error(errorMessage), {
        code: data?.code,
        response: error.response,
      }));
    } else if (error.request) {
      // Request made but no response (network error, server down, etc.)
      return Promise.reject('Network error. Please check your connection.');
    } else {
      // Something else happened (request setup error, etc.)
      return Promise.reject(error.message || 'An unexpected error occurred');
    }
  }
);

// Override the axios instance type to reflect that response interceptor returns response.data
// This makes TypeScript aware that api.get<T>() returns T directly, not AxiosResponse<T>
type AxiosGetType = <T = unknown>(
  url: string,
  config?: import('axios').AxiosRequestConfig
) => Promise<T>;
type AxiosPostType = <T = unknown>(
  url: string,
  data?: unknown,
  config?: import('axios').AxiosRequestConfig
) => Promise<T>;
type AxiosPutType = <T = unknown>(
  url: string,
  data?: unknown,
  config?: import('axios').AxiosRequestConfig
) => Promise<T>;
type AxiosPatchType = <T = unknown>(
  url: string,
  data?: unknown,
  config?: import('axios').AxiosRequestConfig
) => Promise<T>;
type AxiosDeleteType = <T = unknown>(
  url: string,
  config?: import('axios').AxiosRequestConfig
) => Promise<T>;

interface TypedAxiosInstance {
  get: AxiosGetType;
  post: AxiosPostType;
  put: AxiosPutType;
  patch: AxiosPatchType;
  delete: AxiosDeleteType;
}

export default axiosInstance as unknown as TypedAxiosInstance;
