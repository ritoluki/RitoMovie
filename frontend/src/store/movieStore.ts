import { create } from 'zustand';
import { userService } from '@/services/userService';
import { WatchHistory } from '@/types';
import toast from 'react-hot-toast';

interface MovieState {
  watchlist: number[];
  history: WatchHistory[];
  isLoading: boolean;
  
  // Watchlist actions
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (movieId: number) => Promise<void>;
  removeFromWatchlist: (movieId: number) => Promise<void>;
  isInWatchlist: (movieId: number) => boolean;
  
  // History actions
  fetchHistory: () => Promise<void>;
  saveProgress: (movieId: number, progress: number, duration: number) => Promise<void>;
  
  // Clear on logout
  clearStore: () => void;
}

export const useMovieStore = create<MovieState>((set, get) => ({
  watchlist: [],
  history: [],
  isLoading: false,

  fetchWatchlist: async () => {
    try {
      set({ isLoading: true });
      const watchlist = await userService.getWatchlist();
      // Ensure watchlist is always an array
      set({ watchlist: Array.isArray(watchlist) ? watchlist : [], isLoading: false });
    } catch (error) {
      set({ isLoading: false, watchlist: [] }); // Set to empty array on error
      console.error('Error fetching watchlist:', error);
    }
  },

  addToWatchlist: async (movieId: number) => {
    try {
      const watchlist = await userService.addToWatchlist(movieId);
      set({ watchlist });
      toast.success('Added to watchlist');
    } catch (error: any) {
      toast.error(error || 'Failed to add to watchlist');
      throw error;
    }
  },

  removeFromWatchlist: async (movieId: number) => {
    try {
      const watchlist = await userService.removeFromWatchlist(movieId);
      set({ watchlist });
      toast.success('Removed from watchlist');
    } catch (error: any) {
      toast.error(error || 'Failed to remove from watchlist');
      throw error;
    }
  },

  isInWatchlist: (movieId: number) => {
    return get().watchlist.includes(movieId);
  },

  fetchHistory: async () => {
    try {
      set({ isLoading: true });
      const history = await userService.getHistory();
      set({ history, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Error fetching history:', error);
    }
  },

  saveProgress: async (movieId: number, progress: number, duration: number) => {
    try {
      await userService.saveProgress(movieId, progress, duration);
      // Optionally update local history
      await get().fetchHistory();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  },

  clearStore: () => {
    set({ watchlist: [], history: [] });
  },
}));

