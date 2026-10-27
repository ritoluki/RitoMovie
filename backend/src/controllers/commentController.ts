import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import settingsService from '../services/settingsService';
import { isObjectId, isReportPath } from '../utils/reportPolicy';

const DEFAULT_MODERATION_RULES = {
    autoApprove: true,
    blacklistedWords: [] as string[],
    maxCommentLength: 1000,
    minCommentLength: 1,
    spamThreshold: 3,
    autoHideSpoilers: true,
};

// @desc    Get comments for a movie
// @route   GET /api/comments/movie/:movieId
// @access  Public
export const getMovieComments = asyncHandler(
    async (req: Request, res: Response) => {
        const { movieId } = req.params;
        const { page = 1, limit = 10, sort = 'recent' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Sort options
        let sortOption: Record<string, 1 | -1> = { createdAt: -1 }; // default: recent
        if (sort === 'popular') {
            sortOption = { likes: -1 }; // most liked
        } else if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        // Only approved, visible comments are public. Apply the same policy to counts and replies.
        const publicCommentFilter = {
            movie: parseInt(movieId),
            parentComment: null,
            isDeleted: false,
            isApproved: true,
            isHidden: { $ne: true },
        };
        const comments = await Comment.find(publicCommentFilter)
            .populate('user', 'name avatar email')
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get replies count for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const repliesCount = await Comment.countDocuments({
                    parentComment: comment._id,
                    isDeleted: false,
                    isApproved: true,
                    isHidden: { $ne: true },
                });

                return {
                    ...comment,
                    repliesCount,
                    likesCount: comment.likes?.length || 0,
                    dislikesCount: comment.dislikes?.length || 0,
                };
            })
        );

        // Get total count
        const total = await Comment.countDocuments(publicCommentFilter);

        res.status(200).json({
            success: true,
            data: {
                comments: commentsWithReplies,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum),
                },
            },
        });
    }
);

// @desc    Get replies for a comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
export const getCommentReplies = asyncHandler(
    async (req: Request, res: Response) => {
        const { commentId } = req.params;

        const replies = await Comment.find({
            parentComment: commentId,
            isDeleted: false,
            isApproved: true,
            isHidden: { $ne: true },
        })
            .populate('user', 'name avatar email')
            .sort({ createdAt: 1 })
            .lean();

        const repliesWithCounts = replies.map((reply) => ({
            ...reply,
            likesCount: reply.likes?.length || 0,
            dislikesCount: reply.dislikes?.length || 0,
        }));

        res.status(200).json({
            success: true,
            data: repliesWithCounts,
        });
    }
);

export const getCommentThread = asyncHandler(async (req: Request, res: Response) => {
    if (!isObjectId(req.params.id)) throw new ApiError(404, 'notifications.commentUnavailable');
    const visible = { isDeleted: false, isApproved: true, isHidden: { $ne: true } };
    let root = await Comment.findOne({ _id: req.params.id, ...visible }).populate('user', 'name avatar');
    for (let depth = 0; root?.parentComment && depth < 10; depth++) {
        root = await Comment.findOne({ _id: root.parentComment, movie: root.movie, ...visible }).populate('user', 'name avatar');
    }
    if (!root || root.parentComment) throw new ApiError(404, 'notifications.commentUnavailable');
    res.json({ success: true, data: { ...root.toObject(), likesCount: root.likes.length, dislikesCount: root.dislikes.length,
        repliesCount: await Comment.countDocuments({ parentComment: root._id, ...visible }) } });
});

// @desc    Create a comment
// @route   POST /api/comments
// @access  Private
export const createComment = asyncHandler(
    async (req: Request, res: Response) => {
        const { movie, text, rating, isSpoiler, parentComment, sourcePath } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'User not authenticated');
        }

        // Validate required fields
        if (!movie || !text) {
            throw new ApiError(400, 'Movie ID and text are required');
        }

        const rules = {
            ...DEFAULT_MODERATION_RULES,
            ...(await settingsService.getSetting<Partial<typeof DEFAULT_MODERATION_RULES>>('moderation_rules', DEFAULT_MODERATION_RULES)),
        };
        const normalizedText = String(text).trim();
        if (normalizedText.length < rules.minCommentLength || normalizedText.length > rules.maxCommentLength) {
            throw new ApiError(400, `Comment must be between ${rules.minCommentLength} and ${rules.maxCommentLength} characters`);
        }
        const lowerText = normalizedText.toLocaleLowerCase();
        const matchedWord = rules.blacklistedWords.find(word => word && lowerText.includes(word.toLocaleLowerCase()));
        if (matchedWord) throw new ApiError(400, 'Your comment contains a word that is not allowed');

        const duplicateCount = await Comment.countDocuments({
            user: userId,
            text: normalizedText,
            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
            isDeleted: false,
        });
        const spammed = duplicateCount >= rules.spamThreshold;

        // If it's a reply, validate parent comment exists
        if (parentComment) {
            const parent = await Comment.findById(parentComment);
            if (!parent || parent.isDeleted || parent.isHidden || !parent.isApproved || parent.movie !== Number(movie)) {
                throw new ApiError(404, 'Parent comment not found');
            }
        }

        const comment = await Comment.create({
            user: userId,
            movie: parseInt(movie),
            sourcePath: isReportPath(sourcePath) && /^\/(movie|watch)\//.test(sourcePath) ? sourcePath : undefined,
            text: normalizedText,
            rating: rating || null,
            isSpoiler: isSpoiler || false,
            parentComment: parentComment || null,
            isApproved: rules.autoApprove,
            isHidden: spammed || (Boolean(isSpoiler) && rules.autoHideSpoilers),
        });

        // Populate user info
        await comment.populate('user', 'name avatar email');

        res.status(201).json({
            success: true,
            data: {
                ...comment.toObject(),
                likesCount: 0,
                dislikesCount: 0,
                repliesCount: 0,
            },
        });
    }
);

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { text, rating, isSpoiler } = req.body;
        const userId = req.user?.id;

        const comment = await Comment.findById(id);

        if (!comment) {
            throw new ApiError(404, 'Comment not found');
        }

        // Check if user owns the comment
        if (comment.user.toString() !== userId) {
            throw new ApiError(403, 'Not authorized to update this comment');
        }

        // Update fields
        if (text) comment.text = text.trim();
        if (rating !== undefined) comment.rating = rating;
        if (isSpoiler !== undefined) comment.isSpoiler = isSpoiler;

        await comment.save();
        await comment.populate('user', 'name avatar email');

        res.status(200).json({
            success: true,
            data: comment,
        });
    }
);

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user?.id;

        const comment = await Comment.findById(id);

        if (!comment) {
            throw new ApiError(404, 'Comment not found');
        }

        // Check if user owns the comment or is admin
        if (comment.user.toString() !== userId && req.user?.role !== 'admin') {
            throw new ApiError(403, 'Not authorized to delete this comment');
        }

        // Soft delete
        comment.isDeleted = true;
        await comment.save();

        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully',
        });
    }
);

// Store a desired reaction with one atomic update. Concurrent voters cannot overwrite
// one another, and repeating the same desired choice is idempotent.
const applyReaction = async (req: Request, res: Response, reaction: 'like' | 'dislike' | null, toggle = false) => {
    const { id } = req.params;
    if (!isObjectId(id)) throw new ApiError(404, 'Comment not found', 'COMMENT_NOT_AVAILABLE');
    const visible = { isDeleted: false, isApproved: true, isHidden: { $ne: true } };
    const target = await Comment.findOne({ _id: id, ...visible }).select('parentComment');
    if (!target || (target.parentComment && !await Comment.exists({ _id: target.parentComment, ...visible }))) {
        throw new ApiError(404, 'Comment not found', 'COMMENT_NOT_AVAILABLE');
    }
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const existingLikes = { $ifNull: ['$likes', []] };
    const existingDislikes = { $ifNull: ['$dislikes', []] };
    const withoutLike = { $setDifference: [existingLikes, [userId]] };
    const withoutDislike = { $setDifference: [existingDislikes, [userId]] };
    const addLike = { $setUnion: [existingLikes, [userId]] };
    const addDislike = { $setUnion: [existingDislikes, [userId]] };
    const comment = await Comment.findOneAndUpdate({ _id: id, ...visible }, [{
        $set: {
            likes: reaction === 'like' ? toggle ? { $cond: [{ $in: [userId, existingLikes] }, withoutLike, addLike] } : addLike : withoutLike,
            dislikes: reaction === 'dislike' ? toggle ? { $cond: [{ $in: [userId, existingDislikes] }, withoutDislike, addDislike] } : addDislike : withoutDislike,
        },
    }], { new: true }).select('likes dislikes');
    if (!comment) throw new ApiError(404, 'Comment not found', 'COMMENT_NOT_AVAILABLE');
    const liked = comment.likes.some(value => value.equals(userId));
    const disliked = comment.dislikes.some(value => value.equals(userId));
    res.json({ success: true, data: { reaction: liked ? 'like' : disliked ? 'dislike' : null, liked, disliked,
        likesCount: comment.likes.length, dislikesCount: comment.dislikes.length } });
};

export const setCommentReaction = asyncHandler(async (req: Request, res: Response) => {
    const reaction = req.body?.reaction;
    if (reaction !== null && reaction !== 'like' && reaction !== 'dislike') throw new ApiError(400, 'Invalid reaction');
    await applyReaction(req, res, reaction);
});

// Retain compatibility with existing clients while using the same atomic update.
export const likeComment = asyncHandler((req: Request, res: Response) => applyReaction(req, res, 'like', true));
export const dislikeComment = asyncHandler((req: Request, res: Response) => applyReaction(req, res, 'dislike', true));
