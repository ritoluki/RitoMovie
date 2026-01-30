import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for admin store
export interface FilterState {
  search: string;
  role?: string;
  status?: string;
  type?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SortState {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

interface AdminState {
  // Sidebar state
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  
  // Selection state for bulk actions
  selectedUsers: string[];
  selectedMovies: string[];
  selectedComments: string[];
  selectedReports: string[];
  
  // Filter states
  userFilters: FilterState;
  movieFilters: FilterState;
  commentFilters: FilterState;
  reportFilters: FilterState;
  
  // Sort states
  userSort: SortState;
  movieSort: SortState;
  commentSort: SortState;
  reportSort: SortState;
  
  // Pagination states
  userPagination: PaginationState;
  moviePagination: PaginationState;
  commentPagination: PaginationState;
  reportPagination: PaginationState;
  
  // Notification count
  unreadNotifications: number;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  
  // Selection actions
  setSelectedUsers: (ids: string[]) => void;
  toggleUserSelection: (id: string) => void;
  clearUserSelection: () => void;
  
  setSelectedMovies: (ids: string[]) => void;
  toggleMovieSelection: (id: string) => void;
  clearMovieSelection: () => void;
  
  setSelectedComments: (ids: string[]) => void;
  toggleCommentSelection: (id: string) => void;
  clearCommentSelection: () => void;
  
  setSelectedReports: (ids: string[]) => void;
  toggleReportSelection: (id: string) => void;
  clearReportSelection: () => void;
  
  // Filter actions
  setUserFilters: (filters: Partial<FilterState>) => void;
  resetUserFilters: () => void;
  
  setMovieFilters: (filters: Partial<FilterState>) => void;
  resetMovieFilters: () => void;
  
  setCommentFilters: (filters: Partial<FilterState>) => void;
  resetCommentFilters: () => void;
  
  setReportFilters: (filters: Partial<FilterState>) => void;
  resetReportFilters: () => void;
  
  // Sort actions
  setUserSort: (sort: SortState) => void;
  setMovieSort: (sort: SortState) => void;
  setCommentSort: (sort: SortState) => void;
  setReportSort: (sort: SortState) => void;
  
  // Pagination actions
  setUserPagination: (pagination: Partial<PaginationState>) => void;
  setMoviePagination: (pagination: Partial<PaginationState>) => void;
  setCommentPagination: (pagination: Partial<PaginationState>) => void;
  setReportPagination: (pagination: Partial<PaginationState>) => void;
  
  // Notification actions
  setUnreadNotifications: (count: number) => void;
  incrementNotifications: () => void;
  clearNotifications: () => void;
}

const defaultFilters: FilterState = {
  search: '',
};

const defaultSort: SortState = {
  field: 'createdAt',
  order: 'desc',
};

const defaultPagination: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
};

export const useAdminStore = create<AdminState>()(
  devtools(
    (set) => ({
      // Initial states
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      
      selectedUsers: [],
      selectedMovies: [],
      selectedComments: [],
      selectedReports: [],
      
      userFilters: { ...defaultFilters },
      movieFilters: { ...defaultFilters },
      commentFilters: { ...defaultFilters },
      reportFilters: { ...defaultFilters },
      
      userSort: { ...defaultSort },
      movieSort: { ...defaultSort },
      commentSort: { ...defaultSort },
      reportSort: { ...defaultSort },
      
      userPagination: { ...defaultPagination },
      moviePagination: { ...defaultPagination },
      commentPagination: { ...defaultPagination },
      reportPagination: { ...defaultPagination },
      
      unreadNotifications: 0,
      
      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      
      // User selection actions
      setSelectedUsers: (ids) => set({ selectedUsers: ids }),
      toggleUserSelection: (id) =>
        set((state) => ({
          selectedUsers: state.selectedUsers.includes(id)
            ? state.selectedUsers.filter((i) => i !== id)
            : [...state.selectedUsers, id],
        })),
      clearUserSelection: () => set({ selectedUsers: [] }),
      
      // Movie selection actions
      setSelectedMovies: (ids) => set({ selectedMovies: ids }),
      toggleMovieSelection: (id) =>
        set((state) => ({
          selectedMovies: state.selectedMovies.includes(id)
            ? state.selectedMovies.filter((i) => i !== id)
            : [...state.selectedMovies, id],
        })),
      clearMovieSelection: () => set({ selectedMovies: [] }),
      
      // Comment selection actions
      setSelectedComments: (ids) => set({ selectedComments: ids }),
      toggleCommentSelection: (id) =>
        set((state) => ({
          selectedComments: state.selectedComments.includes(id)
            ? state.selectedComments.filter((i) => i !== id)
            : [...state.selectedComments, id],
        })),
      clearCommentSelection: () => set({ selectedComments: [] }),
      
      // Report selection actions
      setSelectedReports: (ids) => set({ selectedReports: ids }),
      toggleReportSelection: (id) =>
        set((state) => ({
          selectedReports: state.selectedReports.includes(id)
            ? state.selectedReports.filter((i) => i !== id)
            : [...state.selectedReports, id],
        })),
      clearReportSelection: () => set({ selectedReports: [] }),
      
      // User filter actions
      setUserFilters: (filters) =>
        set((state) => ({
          userFilters: { ...state.userFilters, ...filters },
          userPagination: { ...state.userPagination, page: 1 }, // Reset to first page on filter change
        })),
      resetUserFilters: () =>
        set({
          userFilters: { ...defaultFilters },
          userPagination: { ...defaultPagination },
        }),
      
      // Movie filter actions
      setMovieFilters: (filters) =>
        set((state) => ({
          movieFilters: { ...state.movieFilters, ...filters },
          moviePagination: { ...state.moviePagination, page: 1 },
        })),
      resetMovieFilters: () =>
        set({
          movieFilters: { ...defaultFilters },
          moviePagination: { ...defaultPagination },
        }),
      
      // Comment filter actions
      setCommentFilters: (filters) =>
        set((state) => ({
          commentFilters: { ...state.commentFilters, ...filters },
          commentPagination: { ...state.commentPagination, page: 1 },
        })),
      resetCommentFilters: () =>
        set({
          commentFilters: { ...defaultFilters },
          commentPagination: { ...defaultPagination },
        }),
      
      // Report filter actions
      setReportFilters: (filters) =>
        set((state) => ({
          reportFilters: { ...state.reportFilters, ...filters },
          reportPagination: { ...state.reportPagination, page: 1 },
        })),
      resetReportFilters: () =>
        set({
          reportFilters: { ...defaultFilters },
          reportPagination: { ...defaultPagination },
        }),
      
      // Sort actions
      setUserSort: (sort) => set({ userSort: sort }),
      setMovieSort: (sort) => set({ movieSort: sort }),
      setCommentSort: (sort) => set({ commentSort: sort }),
      setReportSort: (sort) => set({ reportSort: sort }),
      
      // Pagination actions
      setUserPagination: (pagination) =>
        set((state) => ({ userPagination: { ...state.userPagination, ...pagination } })),
      setMoviePagination: (pagination) =>
        set((state) => ({ moviePagination: { ...state.moviePagination, ...pagination } })),
      setCommentPagination: (pagination) =>
        set((state) => ({ commentPagination: { ...state.commentPagination, ...pagination } })),
      setReportPagination: (pagination) =>
        set((state) => ({ reportPagination: { ...state.reportPagination, ...pagination } })),
      
      // Notification actions
      setUnreadNotifications: (count) => set({ unreadNotifications: count }),
      incrementNotifications: () =>
        set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),
      clearNotifications: () => set({ unreadNotifications: 0 }),
    }),
    { name: 'admin-store' }
  )
);

// Selectors for common use cases
export const selectSidebarState = (state: AdminState) => ({
  collapsed: state.sidebarCollapsed,
  mobileOpen: state.mobileSidebarOpen,
});

export const selectUserManagement = (state: AdminState) => ({
  selected: state.selectedUsers,
  filters: state.userFilters,
  sort: state.userSort,
  pagination: state.userPagination,
});

export const selectMovieManagement = (state: AdminState) => ({
  selected: state.selectedMovies,
  filters: state.movieFilters,
  sort: state.movieSort,
  pagination: state.moviePagination,
});

export const selectCommentManagement = (state: AdminState) => ({
  selected: state.selectedComments,
  filters: state.commentFilters,
  sort: state.commentSort,
  pagination: state.commentPagination,
});

export const selectReportManagement = (state: AdminState) => ({
  selected: state.selectedReports,
  filters: state.reportFilters,
  sort: state.reportSort,
  pagination: state.reportPagination,
});

export default useAdminStore;
