import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import User from '../../models/User';
import WatchHistory from '../../models/WatchHistory';
import Comment from '../../models/Comment';
import Rating from '../../models/Rating';
import { logAdminAction } from '../../middleware/adminAuth';

/**
 * @desc    List all users with pagination, search, and filters
 * @route   GET /api/admin/users
 * @access  Admin
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Build query
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    query.role = role;
  }

  if (status === 'banned') {
    query.isBanned = true;
  } else if (status === 'active') {
    query.isBanned = { $ne: true };
  }

  // Build sort
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const users = await User.find(query)
    .select('-password')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sort);

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: +page,
      limit: +limit,
      total,
      pages: Math.ceil(total / +limit),
    },
  });
});

/**
 * @desc    Get user details
 * @route   GET /api/admin/users/:id
 * @access  Admin
 */
export const getUserDetails = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Get user stats
  const [watchHistoryCount, commentsCount, ratingsCount] = await Promise.all([
    WatchHistory.countDocuments({ user: user._id }),
    Comment.countDocuments({ user: user._id }),
    Rating.countDocuments({ user: user._id }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      stats: {
        watchHistoryCount,
        commentsCount,
        ratingsCount,
      },
    },
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Admin
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, avatar } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const oldValues = { name: user.name, email: user.email };

  if (name) user.name = name;
  if (email) user.email = email;
  if (avatar) user.avatar = avatar;

  await user.save();

  await logAdminAction(req, 'UPDATE', 'USER', user._id.toString(), {
    oldValue: oldValues,
    newValue: { name, email },
  });

  res.status(200).json({
    success: true,
    data: user,
    message: 'User updated successfully',
  });
});

/**
 * @desc    Change user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Super Admin
 */
export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;

  const validRoles = ['user', 'super_admin', 'admin', 'moderator', 'analyst'];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `Invalid role. Valid roles: ${validRoles.join(', ')}`);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent changing own role
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Cannot change your own role');
  }

  const oldRole = user.role;
  user.role = role;
  await user.save();

  await logAdminAction(req, 'ROLE_CHANGE', 'USER', user._id.toString(), {
    oldValue: { role: oldRole },
    newValue: { role },
    targetEmail: user.email,
  });

  res.status(200).json({
    success: true,
    data: user,
    message: `User role changed from ${oldRole} to ${role}`,
  });
});

/**
 * @desc    Ban user
 * @route   PUT /api/admin/users/:id/ban
 * @access  Admin
 */
export const banUser = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent banning admins
  if (['super_admin', 'admin'].includes(user.role)) {
    throw new ApiError(400, 'Cannot ban admin users');
  }

  // Prevent banning yourself
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Cannot ban yourself');
  }

  user.isBanned = true;
  user.banReason = reason;
  user.bannedAt = new Date();
  await user.save();

  await logAdminAction(req, 'BAN_USER', 'USER', user._id.toString(), {
    reason,
    targetEmail: user.email,
  });

  res.status(200).json({
    success: true,
    message: 'User banned successfully',
  });
});

/**
 * @desc    Unban user
 * @route   PUT /api/admin/users/:id/unban
 * @access  Admin
 */
export const unbanUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isBanned = false;
  user.banReason = undefined;
  user.bannedAt = undefined;
  await user.save();

  await logAdminAction(req, 'UNBAN_USER', 'USER', user._id.toString(), {
    targetEmail: user.email,
  });

  res.status(200).json({
    success: true,
    message: 'User unbanned successfully',
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Super Admin
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Cannot delete yourself');
  }

  // Prevent deleting super admin
  if (user.role === 'super_admin') {
    throw new ApiError(400, 'Cannot delete super admin');
  }

  await logAdminAction(req, 'DELETE', 'USER', user._id.toString(), {
    targetEmail: user.email,
    userName: user.name,
  });

  await User.findByIdAndDelete(req.params.id);

  // Also delete related data
  await Promise.all([
    WatchHistory.deleteMany({ user: user._id }),
    Comment.deleteMany({ user: user._id }),
    Rating.deleteMany({ user: user._id }),
  ]);

  res.status(200).json({
    success: true,
    message: 'User and related data deleted successfully',
  });
});

/**
 * @desc    Bulk action on users
 * @route   POST /api/admin/users/bulk-action
 * @access  Admin
 */
export const bulkAction = asyncHandler(async (req: Request, res: Response) => {
  const { action, userIds, reason } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, 'No users selected');
  }

  const validActions = ['ban', 'unban', 'delete'];
  if (!validActions.includes(action)) {
    throw new ApiError(400, `Invalid action. Valid actions: ${validActions.join(', ')}`);
  }

  let result;

  switch (action) {
    case 'ban':
      result = await User.updateMany(
        { _id: { $in: userIds }, role: { $nin: ['super_admin', 'admin'] } },
        { isBanned: true, banReason: reason, bannedAt: new Date() }
      );
      break;
    case 'unban':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { isBanned: false, $unset: { banReason: 1, bannedAt: 1 } }
      );
      break;
    case 'delete':
      // Only super admin can bulk delete
      if (req.user.role !== 'super_admin') {
        throw new ApiError(403, 'Only super admin can bulk delete users');
      }
      result = await User.deleteMany({
        _id: { $in: userIds },
        role: { $nin: ['super_admin', 'admin'] },
      });
      break;
  }

  await logAdminAction(req, 'UPDATE', 'USER', undefined, {
    bulkAction: action,
    userIds,
    reason,
    modifiedCount: result?.modifiedCount || result?.deletedCount,
  });

  res.status(200).json({
    success: true,
    message: `Bulk ${action} completed`,
    modifiedCount: result?.modifiedCount || result?.deletedCount,
  });
});

/**
 * @desc    Get user activity
 * @route   GET /api/admin/users/:id/activity
 * @access  Admin
 */
export const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Get watch history
  const watchHistory = await WatchHistory.find({ user: user._id })
    .populate('movie', 'title poster_path')
    .sort('-watchedAt')
    .skip((+page - 1) * +limit)
    .limit(+limit);

  // Get comments
  const comments = await Comment.find({ user: user._id })
    .populate('movie', 'title')
    .sort('-createdAt')
    .limit(10);

  // Get ratings
  const ratings = await Rating.find({ user: user._id })
    .populate('movie', 'title')
    .sort('-createdAt')
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      watchHistory,
      comments,
      ratings,
    },
  });
});
