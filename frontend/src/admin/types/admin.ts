// Admin Types
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'analyst' | 'user';
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  lastLoginAt?: string;
  loginCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserWithStats {
  user: AdminUser;
  stats: {
    watchHistoryCount: number;
    commentsCount: number;
    ratingsCount: number;
  };
}

export interface AdminMovie {
  _id: string;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  genres: string[];
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  tmdb_id?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMovieWithStats extends AdminMovie {
  stats: {
    commentsCount: number;
    averageRating: number;
    totalRatings: number;
    viewsCount: number;
  };
}

export interface AdminComment {
  _id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  movie: {
    _id: string;
    title: string;
    poster_path?: string;
  };
  isApproved?: boolean;
  isSpoiler?: boolean;
  isHidden?: boolean;
  parentComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReport {
  _id: string;
  reporter: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: 'COMMENT' | 'USER' | 'MOVIE' | 'BUG';
  targetId: string;
  targetModel?: 'Comment' | 'User' | 'Movie';
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'SPOILER' | 'COPYRIGHT' | 'BUG_REPORT' | 'OTHER';
  description: string;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  admin?: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalMovies: number;
    totalComments: number;
    totalRatings: number;
    pendingReports: number;
    activeUsers: number;
  };
  trends: {
    newUsersThisWeek: number;
    userTrend: number;
    newCommentsThisWeek: number;
    commentTrend: number;
  };
}

export interface ChartData {
  userGrowth: Array<{ _id: string; count: number }>;
  viewsData: Array<{ _id: string; count: number }>;
  topGenres: Array<{ _id: string; count: number }>;
  ratingDistribution: Array<{ _id: number; count: number }>;
}

export interface RecentActivity {
  recentUsers: AdminUser[];
  recentComments: AdminComment[];
  recentRatings: Array<{
    _id: string;
    rating: number;
    user: { _id: string; name: string; avatar?: string };
    movie: { _id: string; title: string; poster_path?: string };
    createdAt: string;
  }>;
  recentAdminActions: AuditLog[];
}

export interface SystemAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  count?: number;
}

// Analytics types
export interface TrafficAnalytics {
  period: string;
  userRegistrations: Array<{ _id: string; count: number }>;
  watchActivity: Array<{ _id: string; views: number; uniqueUsers: number }>;
  commentActivity: Array<{ _id: string; count: number }>;
}

export interface UserAnalytics {
  roleDistribution: Array<{ _id: string; count: number }>;
  registrationTrend: Array<{ _id: { year: number; month: number }; count: number }>;
  activeUsers: number;
  bannedUsers: number;
  topActiveUsers: Array<{ 
    _id: string; 
    watchCount: number; 
    lastActive: string;
    user: { name: string; email: string; avatar?: string };
  }>;
}

export interface ContentAnalytics {
  movieStats: { 
    total: number; 
    avgRating: number; 
    totalViews: number;
  };
  genreDistribution: Array<{ _id: string; count: number }>;
  topRatedMovies: Array<{ 
    id: number;
    title: string; 
    vote_average: number;
    vote_count: number; 
    poster_path?: string;
  }>;
  mostWatchedMovies: Array<{ 
    movieId: number;
    watchCount: number;
    title: string; 
    poster_path?: string;
  }>;
  commentStats: {
    total: number;
    approved: number;
    hidden: number;
    deleted: number;
    avgLikes: number;
  };
}

export interface AuditLogStats {
  period: string;
  actionsByType: Array<{ _id: string; count: number }>;
  resourcesByType: Array<{ _id: string; count: number }>;
  actionsByAdmin: Array<{ 
    _id: string;
    count: number;
    admin: { name: string; email: string; avatar?: string };
  }>;
  dailyActivity: Array<{ _id: string; count: number }>;
  securityEvents: Array<{ _id: string; count: number }>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

// Query params types
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'banned';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MovieQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  year?: string;
  status?: 'featured' | 'trending';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CommentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'approved' | 'pending' | 'spoiler';
  movieId?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportQueryParams {
  page?: number;
  limit?: number;
  type?: 'COMMENT' | 'USER' | 'MOVIE' | 'BUG';
  status?: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
