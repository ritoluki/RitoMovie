import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      rememberMe: true,

      login: async (email: string, password: string, rememberMe: boolean = true) => {
        try {
          set({ isLoading: true });
          const { user, token } = await authService.login({ email, password, rememberMe });

          // Store based on rememberMe preference
          if (!rememberMe) {
            // Clear localStorage and use sessionStorage instead
            localStorage.removeItem('auth-storage');
            sessionStorage.setItem('auth-token', token);
            sessionStorage.setItem('auth-user', JSON.stringify(user));
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            rememberMe,
          });

          toast.success('Login successful!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error || 'Login failed');
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          set({ isLoading: true });
          const { user, token } = await authService.register({
            name,
            email,
            password,
          });

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('Registration successful!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error || 'Registration failed');
          throw error;
        }
      },

      loginWithGoogle: async (credential: string) => {
        try {
          set({ isLoading: true });
          const { user, token } = await authService.googleLogin(credential);

          // Google login always uses localStorage (remember me = true)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            rememberMe: true,
          });

          toast.success('Google login successful!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error || 'Google login failed');
          throw error;
        }
      },

      logout: () => {
        // Clear both localStorage and sessionStorage
        sessionStorage.removeItem('auth-token');
        sessionStorage.removeItem('auth-user');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          rememberMe: true,
        });
        toast.success('Logged out successfully');
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          const user = await authService.updateProfile(data);
          set({ user });
          toast.success('Profile updated successfully');
        } catch (error: any) {
          toast.error(error || 'Failed to update profile');
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      initialize: async () => {
        // Check sessionStorage first (for non-remember-me sessions)
        const sessionToken = sessionStorage.getItem('auth-token');
        const sessionUser = sessionStorage.getItem('auth-user');

        if (sessionToken && sessionUser) {
          try {
            const user = JSON.parse(sessionUser);
            set({ user, token: sessionToken, isAuthenticated: true, rememberMe: false });
            // Verify token is still valid
            await authService.getMe();
          } catch (error) {
            sessionStorage.removeItem('auth-token');
            sessionStorage.removeItem('auth-user');
            set({ user: null, token: null, isAuthenticated: false });
          }
          return;
        }

        // Otherwise check localStorage (for remember-me sessions)
        const token = get().token;
        if (token) {
          try {
            const user = await authService.getMe();
            set({ user, isAuthenticated: true });
          } catch (error) {
            // Token is invalid, clear state
            set({ user: null, token: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

