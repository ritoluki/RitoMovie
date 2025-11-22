import axios from 'axios';
import { API_BASE_URL } from '@/utils/constants';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
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
    // The API response structure is: { success: true, data: {...}, message: '...' }
    // Return the response data directly (which includes success, data, message)
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - only redirect if not already on login/register page
        // This prevents redirect loops during login attempts
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
      }

      // Extract error message from response
      // API error response structure: { success: false, message: '...', data: null }
      const errorMessage = data?.message || error.message || 'An error occurred';
      return Promise.reject(errorMessage);
    } else if (error.request) {
      // Request made but no response (network error, server down, etc.)
      return Promise.reject('Network error. Please check your connection.');
    } else {
      // Something else happened (request setup error, etc.)
      return Promise.reject(error.message || 'An unexpected error occurred');
    }
  }
);

export default axiosInstance;

