import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import User from '../../models/User';
import Movie from '../../models/Movie';
import Comment from '../../models/Comment';
import WatchHistory from '../../models/WatchHistory';

/**
 * @desc    Get traffic analytics
 * @route   GET /api/admin/analytics/traffic
 * @access  Admin (Analyst+)
 */
export const getTrafficAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  
  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get daily user registrations
  const userRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Get daily watch activity
  const watchActivity = await WatchHistory.aggregate([
    {
      $match: {
        watchedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$watchedAt' },
        },
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
      },
    },
    {
      $project: {
        _id: 1,
        views: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Get daily comments
  const commentActivity = await Comment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      userRegistrations,
      watchActivity,
      commentActivity,
    },
  });
});

/**
 * @desc    Get user analytics
 * @route   GET /api/admin/analytics/users
 * @access  Admin (Analyst+)
 */
export const getUserAnalytics = asyncHandler(async (req: Request, res: Response) => {
  // User role distribution
  const roleDistribution = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  // User registration trend (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const registrationTrend = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Active users (users with activity in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = await User.countDocuments({
    lastLoginAt: { $gte: thirtyDaysAgo },
  });

  // Banned users
  const bannedUsers = await User.countDocuments({ isBanned: true });

  // Top users by activity
  const topActiveUsers = await WatchHistory.aggregate([
    {
      $match: {
        watchedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: '$user',
        watchCount: { $sum: 1 },
        lastActive: { $max: '$watchedAt' },
      },
    },
    { $sort: { watchCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        watchCount: 1,
        lastActive: 1,
        'user.name': 1,
        'user.email': 1,
        'user.avatar': 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      roleDistribution,
      registrationTrend,
      activeUsers,
      bannedUsers,
      topActiveUsers,
    },
  });
});

/**
 * @desc    Get content analytics
 * @route   GET /api/admin/analytics/content
 * @access  Admin (Analyst+)
 */
export const getContentAnalytics = asyncHandler(async (req: Request, res: Response) => {
  // Movie statistics
  const movieStats = await Movie.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgRating: { $avg: '$vote_average' },
        totalViews: { $sum: { $ifNull: ['$view_count', 0] } },
      },
    },
  ]);

  // Genre distribution
  const genreDistribution = await Movie.aggregate([
    { $unwind: '$genres' },
    {
      $group: {
        _id: '$genres.name',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // Top rated movies
  const topRatedMovies = await Movie.find()
    .sort({ vote_average: -1 })
    .limit(10)
    .select('id title vote_average vote_count poster_path');

  // Most watched movies
  const mostWatchedMovies = await WatchHistory.aggregate([
    {
      $group: {
        _id: '$movie',
        watchCount: { $sum: 1 },
      },
    },
    { $sort: { watchCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'movies',
        localField: '_id',
        foreignField: 'id',
        as: 'movie',
      },
    },
    { $unwind: { path: '$movie', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        movieId: '$_id',
        watchCount: 1,
        title: '$movie.title',
        poster_path: '$movie.poster_path',
      },
    },
  ]);

  // Comment statistics
  const commentStats = await Comment.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: { $sum: { $cond: ['$isApproved', 1, 0] } },
        hidden: { $sum: { $cond: ['$isHidden', 1, 0] } },
        deleted: { $sum: { $cond: ['$isDeleted', 1, 0] } },
        avgLikes: { $avg: { $size: { $ifNull: ['$likes', []] } } },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      movieStats: movieStats[0] || { total: 0, avgRating: 0, totalViews: 0 },
      genreDistribution,
      topRatedMovies,
      mostWatchedMovies,
      commentStats: commentStats[0] || { total: 0, approved: 0, hidden: 0, deleted: 0, avgLikes: 0 },
    },
  });
});

/**
 * @desc    Get search trends
 * @route   GET /api/admin/analytics/search-trends
 * @access  Admin (Analyst+)
 */
export const getSearchTrends = asyncHandler(async (req: Request, res: Response) => {
  // This would typically come from a search log collection
  // For now, return popular genres as a proxy
  const popularGenres = await Movie.aggregate([
    { $unwind: '$genres' },
    {
      $group: {
        _id: '$genres.name',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  // Popular keywords from movie keywords
  const popularKeywords = await Movie.aggregate([
    { $unwind: { path: '$keywords.keywords', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$keywords.keywords.name',
        count: { $sum: 1 },
      },
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  res.status(200).json({
    success: true,
    data: {
      popularGenres,
      popularKeywords,
    },
  });
});

/**
 * @desc    Export analytics report
 * @route   GET /api/admin/analytics/export
 * @access  Admin (Admin+)
 */
export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const { type = 'summary', format = 'json' } = req.query;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Gather all statistics
  const [
    totalUsers,
    newUsers,
    totalMovies,
    totalComments,
    activeWatchers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Movie.countDocuments(),
    Comment.countDocuments({ isDeleted: false }),
    WatchHistory.distinct('user', { watchedAt: { $gte: thirtyDaysAgo } }).then(arr => arr.length),
  ]);

  const report = {
    generatedAt: now.toISOString(),
    period: 'Last 30 days',
    summary: {
      totalUsers,
      newUsersLast30Days: newUsers,
      totalMovies,
      totalComments,
      activeWatchersLast30Days: activeWatchers,
    },
  };

  if (format === 'csv') {
    // Convert to CSV format
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Users', totalUsers],
      ['New Users (30d)', newUsers],
      ['Total Movies', totalMovies],
      ['Total Comments', totalComments],
      ['Active Watchers (30d)', activeWatchers],
    ];
    
    const csv = csvRows.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${now.toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});
