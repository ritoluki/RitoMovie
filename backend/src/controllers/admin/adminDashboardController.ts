import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import User from '../../models/User';
import Movie from '../../models/Movie';
import Comment from '../../models/Comment';
import Rating from '../../models/Rating';
import WatchHistory from '../../models/WatchHistory';
import AuditLog from '../../models/AuditLog';
import Report from '../../models/Report';

/**
 * @desc    Get dashboard overview statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Admin
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Get total counts
  const [totalUsers, totalMovies, totalComments, totalRatings] = await Promise.all([
    User.countDocuments(),
    Movie.countDocuments(),
    Comment.countDocuments(),
    Rating.countDocuments(),
  ]);

  // Get new counts this week
  const [newUsersThisWeek, newCommentsThisWeek] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: lastWeek } }),
    Comment.countDocuments({ createdAt: { $gte: lastWeek } }),
  ]);

  // Get previous week counts for comparison
  const twoWeeksAgo = new Date(lastWeek);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

  const [usersLastWeek, commentsLastWeek] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: lastWeek } }),
    Comment.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: lastWeek } }),
  ]);

  // Calculate trends
  const userTrend = usersLastWeek > 0 
    ? Math.round(((newUsersThisWeek - usersLastWeek) / usersLastWeek) * 100) 
    : 100;
  const commentTrend = commentsLastWeek > 0 
    ? Math.round(((newCommentsThisWeek - commentsLastWeek) / commentsLastWeek) * 100) 
    : 100;

  // Get pending reports count
  const pendingReports = await Report.countDocuments({ status: 'PENDING' });

  // Get active users (watched something in last 30 days)
  const activeUsers = await WatchHistory.distinct('user', {
    watchedAt: { $gte: lastMonth },
  });

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalMovies,
        totalComments,
        totalRatings,
        pendingReports,
        activeUsers: activeUsers.length,
      },
      trends: {
        newUsersThisWeek,
        userTrend,
        newCommentsThisWeek,
        commentTrend,
      },
    },
  });
});

/**
 * @desc    Get chart data for dashboard
 * @route   GET /api/admin/dashboard/charts
 * @access  Admin
 */
export const getCharts = asyncHandler(async (req: Request, res: Response) => {
  const { period = '7d' } = req.query;

  let daysBack = 7;
  if (period === '30d') daysBack = 30;
  if (period === '90d') daysBack = 90;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  startDate.setHours(0, 0, 0, 0);

  // User registrations over time
  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Views over time (from watch history)
  const viewsData = await WatchHistory.aggregate([
    { $match: { watchedAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$watchedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top genres
  const topGenres = await Movie.aggregate([
    { $unwind: '$genres' },
    { $group: { _id: '$genres', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // Rating distribution
  const ratingDistribution = await Rating.aggregate([
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      userGrowth,
      viewsData,
      topGenres,
      ratingDistribution,
    },
  });
});

/**
 * @desc    Get recent activity feed
 * @route   GET /api/admin/dashboard/activity
 * @access  Admin
 */
export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 20 } = req.query;

  // Get recent users
  const recentUsers = await User.find()
    .select('name email avatar createdAt')
    .sort('-createdAt')
    .limit(5);

  // Get recent comments
  const recentComments = await Comment.find()
    .populate('user', 'name avatar')
    .populate('movie', 'title poster_path')
    .sort('-createdAt')
    .limit(5);

  // Get recent ratings
  const recentRatings = await Rating.find()
    .populate('user', 'name avatar')
    .populate('movie', 'title poster_path')
    .sort('-createdAt')
    .limit(5);

  // Get recent admin actions
  const recentAdminActions = await AuditLog.find()
    .populate('admin', 'name email')
    .sort('-createdAt')
    .limit(+limit);

  res.status(200).json({
    success: true,
    data: {
      recentUsers,
      recentComments,
      recentRatings,
      recentAdminActions,
    },
  });
});

/**
 * @desc    Get system alerts
 * @route   GET /api/admin/dashboard/alerts
 * @access  Admin
 */
export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    count?: number;
  }> = [];

  // Check for pending reports
  const pendingReports = await Report.countDocuments({ status: 'PENDING' });
  if (pendingReports > 0) {
    alerts.push({
      type: 'warning',
      message: `${pendingReports} pending report(s) require attention`,
      count: pendingReports,
    });
  }

  // Check for critical reports
  const criticalReports = await Report.countDocuments({
    status: 'PENDING',
    priority: 'CRITICAL',
  });
  if (criticalReports > 0) {
    alerts.push({
      type: 'error',
      message: `${criticalReports} critical report(s) need immediate attention`,
      count: criticalReports,
    });
  }

  // Check for failed login attempts in last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const failedLogins = await AuditLog.countDocuments({
    action: 'UNAUTHORIZED_ACCESS',
    createdAt: { $gte: yesterday },
  });
  if (failedLogins > 10) {
    alerts.push({
      type: 'warning',
      message: `${failedLogins} unauthorized access attempts in the last 24 hours`,
      count: failedLogins,
    });
  }

  res.status(200).json({
    success: true,
    data: alerts,
  });
});
