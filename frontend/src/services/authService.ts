import axios from '@/lib/axios';
import { User, ApiResponse } from '@/types';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Register new user
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await axios.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      credentials
    );
    // Response already unwrapped by axios interceptor: { success, data }
    return (response as any).data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );
    // Response already unwrapped by axios interceptor: { success, data }
    return (response as any).data;
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const response = await axios.get<ApiResponse<User>>('/auth/me');
    // Response already unwrapped by axios interceptor: { success, data }
    return (response as any).data;
  },

  // Update profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await axios.put<ApiResponse<User>>('/auth/profile', data);
    // Response already unwrapped by axios interceptor: { success, data }
    return (response as any).data;
  },

  // Update password
  updatePassword: async (currentPassword: string, newPassword: string): Promise<{ token: string }> => {
    const response = await axios.put<ApiResponse<{ token: string }>>(
      '/auth/password',
      { currentPassword, newPassword }
    );
    // Response already unwrapped by axios interceptor: { success, data }
    return (response as any).data;
  },
};

