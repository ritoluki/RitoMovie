import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import Comment from '../../models/Comment';
import Movie from '../../models/Movie';
import { logAdminAction } from '../../middleware/adminAuth';

/**
 * @desc    List all comments with pagination and filters
 * @route   GET /api/admin/comments
 * @access  Admin
 */
export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    movieId,
    userId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Build query
  const query: Record<string, unknown> = {};
  // Exclude deleted comments
  query.isDeleted = false;

  if (search) {
    query.text = { $regex: search, $options: 'i' };
  }

  if (status === 'approved') {
    query.isApproved = true;
  } else if (status === 'pending') {
    query.isApproved = { $ne: true };
  } else if (status === 'spoiler') {
    query.isSpoiler = true;
  }

  if (movieId) {
    query.movie = movieId;
  }

  if (userId) {
    query.user = userId;
  }

  // Build sort
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const comments = await Comment.find(query)
    .populate('user', 'name email avatar')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sort)
    .lean();

  // Get unique movie IDs (TMDB IDs)
  const movieIds = [...new Set(comments.map(c => c.movie))];
  
  // Fetch movie info from Movie collection or use TMDB ID as fallback
  const movies = await Movie.find({ tmdbId: { $in: movieIds } }).select('tmdbId title poster').lean();
  const movieMap = new Map(movies.map(m => [m.tmdbId, { _id: m._id, title: m.title, poster_path: m.poster }]));

  // Transform comments to include movie info
  const commentsWithMovieInfo = comments.map(comment => ({
    ...comment,
    content: comment.text, // Map 'text' to 'content' for frontend compatibility
    movie: movieMap.get(comment.movie) || { 
      _id: String(comment.movie), 
      title: `Movie #${comment.movie}`, 
      poster_path: null 
    },
  }));

  const total = await Comment.countDocuments(query);

  res.status(200).json({
    success: true,
    data: commentsWithMovieInfo,
    pagination: {
      page: +page,
      limit: +limit,
      total,
      pages: Math.ceil(total / +limit),
    },
  });
});

/**
 * @desc    Update comment status
 * @route   PUT /api/admin/comments/:id
 * @access  Admin
 */
export const updateCommentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isApproved, isSpoiler, isHidden } = req.body;

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const oldStatus = {
    isApproved: comment.isApproved,
    isSpoiler: comment.isSpoiler,
    isHidden: comment.isHidden,
  };

  if (typeof isApproved === 'boolean') comment.isApproved = isApproved;
  if (typeof isSpoiler === 'boolean') comment.isSpoiler = isSpoiler;
  if (typeof isHidden === 'boolean') comment.isHidden = isHidden;

  await comment.save();

  await logAdminAction(req, 'UPDATE', 'COMMENT', comment._id.toString(), {
    oldStatus,
    newStatus: { isApproved, isSpoiler, isHidden },
  });

  res.status(200).json({
    success: true,
    data: comment,
    message: 'Comment updated successfully',
  });
});

/**
 * @desc    Delete comment
 * @route   DELETE /api/admin/comments/:id
 * @access  Admin
 */
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  await logAdminAction(req, 'DELETE', 'COMMENT', comment._id.toString(), {
    content: comment.text.substring(0, 100),
    user: comment.user,
    movie: comment.movie,
  });

  await Comment.findByIdAndDelete(req.params.id);

  // Also delete replies if this is a parent comment
  if (!comment.parentComment) {
    await Comment.deleteMany({ parentComment: comment._id });
  }

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

/**
 * @desc    Bulk action on comments
 * @route   POST /api/admin/comments/bulk-action
 * @access  Admin
 */
export const bulkAction = asyncHandler(async (req: Request, res: Response) => {
  const { action, commentIds } = req.body;

  if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
    throw new ApiError(400, 'No comments selected');
  }

  const validActions = ['approve', 'reject', 'hide', 'unhide', 'delete', 'mark-spoiler', 'unmark-spoiler'];
  if (!validActions.includes(action)) {
    throw new ApiError(400, `Invalid action. Valid actions: ${validActions.join(', ')}`);
  }

  let result;

  switch (action) {
    case 'approve':
      result = await Comment.updateMany(
        { _id: { $in: commentIds } },
        { isApproved: true }
      );
      break;
    case 'reject':
      result = await Comment.updateMany(
        { _id: { $in: commentIds } },
        { isApproved: false }
      );
      break;
    case 'hide':
      result = await Comment.updateMany(
        { _id: { $in: commentIds } },
        { isHidden: true }
      );
      break;
    case 'unhide':
      result = await Comment.updateMany(
        { _id: { $in: commentIds } },
        { isHidden: false }
      );
      break;
    case 'delete':
      result = await Comment.deleteMany({ _id: { $in: commentIds } });
      break;
    case 'mark-spoiler':
      result = await Comment.updateMany(
        { _id: { $in: commentIds } },
        { isSpoiler: true }
      );
      break;
    case 'unmark-spoiler':
      result = await Comment.updateMany(
        { _id: { $in: commentIds } },
        { isSpoiler: false }
      );
      break;
  }

  await logAdminAction(req, 'UPDATE', 'COMMENT', undefined, {
    bulkAction: action,
    commentIds,
    modifiedCount: result?.modifiedCount || result?.deletedCount,
  });

  res.status(200).json({
    success: true,
    message: `Bulk ${action} completed`,
    modifiedCount: result?.modifiedCount || result?.deletedCount,
  });
});

/**
 * @desc    Get moderation rules
 * @route   GET /api/admin/moderation/rules
 * @access  Admin
 */
export const getModerationRules = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement moderation rules from SystemSettings
  const rules = {
    autoApprove: false,
    blacklistedWords: [],
    maxCommentLength: 1000,
    minCommentLength: 1,
    spamThreshold: 3,
    autoHideSpoilers: true,
  };

  res.status(200).json({
    success: true,
    data: rules,
  });
});

/**
 * @desc    Update moderation rules
 * @route   PUT /api/admin/moderation/rules
 * @access  Admin
 */
export const updateModerationRules = asyncHandler(async (req: Request, res: Response) => {
  const rules = req.body;

  // TODO: Save to SystemSettings
  await logAdminAction(req, 'SETTINGS_CHANGE', 'SETTINGS', undefined, {
    type: 'moderation_rules',
    newRules: rules,
  });

  res.status(200).json({
    success: true,
    data: rules,
    message: 'Moderation rules updated successfully',
  });
});
