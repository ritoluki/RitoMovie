import api from '@/lib/axios';
import type {
  DashboardStats,
  ChartData,
  RecentActivity,
  SystemAlert,
  AdminUser,
  AdminUserWithStats,
  AdminMovie,
  AdminMovieWithStats,
  AdminComment,
  AdminReport,
  AuditLog,
  AuditLogStats,
  TrafficAnalytics,
  UserAnalytics,
  ContentAnalytics,
  UserQueryParams,
  MovieQueryParams,
  CommentQueryParams,
  ReportQueryParams,
  ApiResponse,
  PaginationInfo,
} from '../types/admin';

// ==========================================
// Dashboard API
// ==========================================
export const adminService = {
  // Dashboard
  getDashboardStats: () => 
    api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats'),
  
  getDashboardCharts: (period: '7d' | '30d' | '90d' = '7d') =>
    api.get<ApiResponse<ChartData>>('/admin/dashboard/charts', { params: { period } }),
  
  getDashboardActivity: (limit = 20) =>
    api.get<ApiResponse<RecentActivity>>('/admin/dashboard/activity', { params: { limit } }),
  
  getDashboardAlerts: () =>
    api.get<ApiResponse<SystemAlert[]>>('/admin/dashboard/alerts'),

  // ==========================================
  // Users API
  // ==========================================
  getUsers: (params: UserQueryParams) =>
    api.get<ApiResponse<AdminUser[]> & { pagination: PaginationInfo }>('/admin/users', { params }),
  
  getUserDetails: (id: string) =>
    api.get<ApiResponse<AdminUserWithStats>>(`/admin/users/${id}`),
  
  getUserActivity: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/admin/users/${id}/activity`, { params }),
  
  updateUser: (id: string, data: Partial<AdminUser>) =>
    api.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, data),
  
  changeUserRole: (id: string, role: string) =>
    api.put<ApiResponse<AdminUser>>(`/admin/users/${id}/role`, { role }),
  
  banUser: (id: string, reason: string) =>
    api.put<ApiResponse<void>>(`/admin/users/${id}/ban`, { reason }),
  
  unbanUser: (id: string) =>
    api.put<ApiResponse<void>>(`/admin/users/${id}/unban`),
  
  deleteUser: (id: string) =>
    api.delete<ApiResponse<void>>(`/admin/users/${id}`),
  
  bulkUserAction: (action: 'ban' | 'unban' | 'delete', userIds: string[], reason?: string) =>
    api.post<ApiResponse<{ modifiedCount: number }>>('/admin/users/bulk-action', { action, userIds, reason }),

  // ==========================================
  // Movies API
  // ==========================================
  getMovies: (params: MovieQueryParams) =>
    api.get<ApiResponse<AdminMovie[]> & { pagination: PaginationInfo }>('/admin/movies', { params }),
  
  getMovieDetails: (id: string) =>
    api.get<ApiResponse<AdminMovieWithStats>>(`/admin/movies/${id}`),
  
  createMovie: (data: Partial<AdminMovie>) =>
    api.post<ApiResponse<AdminMovie>>('/admin/movies', data),
  
  updateMovie: (id: string, data: Partial<AdminMovie>) =>
    api.put<ApiResponse<AdminMovie>>(`/admin/movies/${id}`, data),
  
  deleteMovie: (id: string) =>
    api.delete<ApiResponse<void>>(`/admin/movies/${id}`),
  
  setMovieFeatured: (id: string, isFeatured: boolean) =>
    api.post<ApiResponse<AdminMovie>>(`/admin/movies/${id}/feature`, { isFeatured }),
  
  setMovieTrending: (id: string, isTrending: boolean) =>
    api.post<ApiResponse<AdminMovie>>(`/admin/movies/${id}/trending`, { isTrending }),
  
  importFromTMDB: (tmdbId: number) =>
    api.post<ApiResponse<AdminMovie>>('/admin/movies/import-tmdb', { tmdbId }),
  
  bulkMovieAction: (action: 'delete' | 'feature' | 'unfeature' | 'trending' | 'untrending', movieIds: string[]) =>
    api.post<ApiResponse<{ modifiedCount: number }>>('/admin/movies/bulk-action', { action, movieIds }),
  
  getGenres: () =>
    api.get<ApiResponse<Array<{ _id: string; count: number }>>>('/admin/genres'),

  // ==========================================
  // Comments API
  // ==========================================
  getComments: (params: CommentQueryParams) =>
    api.get<ApiResponse<AdminComment[]> & { pagination: PaginationInfo }>('/admin/comments', { params }),
  
  updateCommentStatus: (id: string, data: { isApproved?: boolean; isSpoiler?: boolean; isHidden?: boolean }) =>
    api.put<ApiResponse<AdminComment>>(`/admin/comments/${id}`, data),
  
  deleteComment: (id: string) =>
    api.delete<ApiResponse<void>>(`/admin/comments/${id}`),
  
  bulkCommentAction: (
    action: 'approve' | 'reject' | 'hide' | 'unhide' | 'delete' | 'mark-spoiler' | 'unmark-spoiler',
    commentIds: string[]
  ) =>
    api.post<ApiResponse<{ modifiedCount: number }>>('/admin/comments/bulk-action', { action, commentIds }),
  
  getModerationRules: () =>
    api.get('/admin/moderation/rules'),
  
  updateModerationRules: (rules: Record<string, unknown>) =>
    api.put('/admin/moderation/rules', rules),

  // ==========================================
  // Reports API
  // ==========================================
  getReports: (params: ReportQueryParams) =>
    api.get<ApiResponse<AdminReport[]> & { 
      pagination: PaginationInfo; 
      statusCounts: Record<string, number>;
    }>('/admin/reports', { params }),
  
  getReportDetails: (id: string) =>
    api.get<ApiResponse<{ report: AdminReport; target: unknown }>>(`/admin/reports/${id}`),
  
  updateReportStatus: (id: string, status: AdminReport['status']) =>
    api.put<ApiResponse<AdminReport>>(`/admin/reports/${id}/status`, { status }),
  
  updateReportPriority: (id: string, priority: AdminReport['priority']) =>
    api.put<ApiResponse<AdminReport>>(`/admin/reports/${id}/priority`, { priority }),
  
  resolveReport: (id: string, resolution: string, action?: string) =>
    api.post<ApiResponse<AdminReport>>(`/admin/reports/${id}/resolve`, { resolution, action }),
  
  rejectReport: (id: string, reason: string) =>
    api.post<ApiResponse<AdminReport>>(`/admin/reports/${id}/reject`, { reason }),
  
  bulkReportAction: (action: 'resolve' | 'reject' | 'set-reviewing', reportIds: string[], reason?: string) =>
    api.post<ApiResponse<{ modifiedCount: number }>>('/admin/reports/bulk-action', { action, reportIds, reason }),

  // ==========================================
  // Analytics API
  // ==========================================
  getTrafficAnalytics: (period: '7d' | '30d' | '90d' | '1y' = '30d') =>
    api.get<ApiResponse<TrafficAnalytics>>('/admin/analytics/traffic', { params: { period } }),
  
  getUserAnalytics: () =>
    api.get<ApiResponse<UserAnalytics>>('/admin/analytics/users'),
  
  getContentAnalytics: () =>
    api.get<ApiResponse<ContentAnalytics>>('/admin/analytics/content'),
  
  getSearchTrends: () =>
    api.get<ApiResponse<Array<{ term: string; count: number }>>>('/admin/analytics/search-trends'),
  
  exportAnalyticsReport: (type: string = 'summary', format: 'json' | 'csv' = 'json') =>
    api.get<Blob | ApiResponse<unknown>>('/admin/analytics/export', { 
      params: { type, format },
      responseType: format === 'csv' ? 'blob' : 'json',
    }),

  // ==========================================
  // Audit Logs API
  // ==========================================
  getAuditLogs: (params?: { 
    page?: number; 
    limit?: number; 
    admin?: string; 
    action?: string; 
    resource?: string;
    search?: string;
    dateFrom?: string; 
    dateTo?: string;
  }) =>
    api.get<ApiResponse<AuditLog[]> & { pagination: PaginationInfo }>('/admin/audit-logs', { params }),
  
  getAuditLogDetails: (id: string) =>
    api.get<ApiResponse<AuditLog>>(`/admin/audit-logs/${id}`),
  
  getAuditLogStats: (period: '24h' | '7d' | '30d' = '7d') =>
    api.get<ApiResponse<AuditLogStats>>('/admin/audit-logs/stats', { params: { period } }),
  
  exportAuditLogs: (format: 'json' | 'csv' = 'json', dateFrom?: string, dateTo?: string) =>
    api.get<Blob | ApiResponse<AuditLog[]>>('/admin/audit-logs/export', { 
      params: { format, dateFrom, dateTo },
      responseType: format === 'csv' ? 'blob' : 'json',
    }),

  // ==========================================
  // Settings API
  // ==========================================
  getSettings: () =>
    api.get('/admin/settings'),
  
  getCategorySettings: (category: string) =>
    api.get(`/admin/settings/${category}`),
  
  updateSettings: (settings: Array<{ key: string; value: unknown; category?: string; description?: string }>) =>
    api.put('/admin/settings', { settings }),
  
  deleteSetting: (key: string) =>
    api.delete(`/admin/settings/${key}`),
  
  testEmailSettings: (email: string) =>
    api.post('/admin/settings/test-email', { email }),
  
  initializeSettings: () =>
    api.post('/admin/settings/initialize'),

  // ==========================================
  // Cache Management API (Super Admin only)
  // ==========================================
  getCacheStats: () =>
    api.get('/admin/cache/stats'),
  
  warmCache: () =>
    api.post('/admin/cache/warm'),
  
  clearAllCache: () =>
    api.delete('/admin/cache/clear'),
  
  clearCachePattern: (pattern: string) =>
    api.delete(`/admin/cache/clear/${encodeURIComponent(pattern)}`),
};

export default adminService;
