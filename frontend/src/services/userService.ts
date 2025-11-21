import axios from '@/lib/axios';
import { WatchHistory, Rating, ApiResponse } from '@/types';

export const userService = {
  // Watchlist
  getWatchlist: async (): Promise<number[]> => {
    try {
      // Axios interceptor returns response.data which is ApiResponse<T>
      const response = await axios.get<ApiResponse<number[]>>('/users/watchlist');
      // Response is already ApiResponse<T>, so response.data is the actual data
      const watchlist = (response as any).data;
      return Array.isArray(watchlist) ? watchlist : [];
    } catch (error) {
      // Return empty array on error instead of throwing
      console.error('Error fetching watchlist:', error);
      return [];
    }
  },

  addToWatchlist: async (movieId: number): Promise<number[]> => {
    try {
      const response = await axios.post<ApiResponse<number[]>>(
        `/users/watchlist/${movieId}`
      );
      // Response is already ApiResponse<T>, so response.data is the actual data
      const watchlist = (response as any).data;
      return Array.isArray(watchlist) ? watchlist : [];
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  removeFromWatchlist: async (movieId: number): Promise<number[]> => {
    try {
      const response = await axios.delete<ApiResponse<number[]>>(
        `/users/watchlist/${movieId}`
      );
      // Response is already ApiResponse<T>, so response.data is the actual data
      const watchlist = (response as any).data;
      return Array.isArray(watchlist) ? watchlist : [];
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },

  checkWatchlist: async (movieId: number): Promise<{ inWatchlist: boolean }> => {
    const response = await axios.get<ApiResponse<{ inWatchlist: boolean }>>(
      `/users/watchlist/${movieId}/check`
    );
    // Response is already ApiResponse<T>, so response.data is the actual data
    return (response as any).data;
  },

  // Watch History
  getHistory: async (): Promise<WatchHistory[]> => {
    const response = await axios.get<ApiResponse<WatchHistory[]>>('/users/history');
    // Response is already ApiResponse<T>, so response.data is the actual data
    return (response as any).data;
  },

  saveProgress: async (
    movieId: number,
    progress: number,
    duration: number
  ): Promise<WatchHistory> => {
    const response = await axios.post<ApiResponse<WatchHistory>>('/users/history', {
      movieId,
      progress,
      duration,
    });
    return response.data.data;
  },

  getMovieProgress: async (movieId: number): Promise<WatchHistory | null> => {
    try {
      const response = await axios.get<ApiResponse<WatchHistory>>(
        `/users/history/${movieId}`
      );
      return response.data.data;
    } catch {
      return null;
    }
  },

  deleteHistory: async (movieId: number): Promise<void> => {
    await axios.delete(`/users/history/${movieId}`);
  },

  // Ratings
  rateMovie: async (
    movieId: number,
    rating: number,
    review?: string
  ): Promise<Rating> => {
    const response = await axios.post<ApiResponse<Rating>>('/users/ratings', {
      movieId,
      rating,
      review,
    });
    return response.data.data;
  },

  getMovieRating: async (movieId: number): Promise<Rating | null> => {
    try {
      const response = await axios.get<ApiResponse<Rating>>(
        `/users/ratings/${movieId}`
      );
      return response.data.data;
    } catch {
      return null;
    }
  },

  getUserRatings: async (): Promise<Rating[]> => {
    const response = await axios.get<ApiResponse<Rating[]>>('/users/ratings');
    return response.data.data;
  },

  deleteRating: async (movieId: number): Promise<void> => {
    await axios.delete(`/users/ratings/${movieId}`);
  },

  getAverageRating: async (
    movieId: number
  ): Promise<{ average: number; count: number }> => {
    const response = await axios.get<ApiResponse<{ average: number; count: number }>>(
      `/users/ratings/${movieId}/average`
    );
    return response.data.data;
  },
};

