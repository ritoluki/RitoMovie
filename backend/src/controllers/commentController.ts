import { Request, Response } from 'express';
import Comment from '../models/Comment';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';

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

        // Get only parent comments (not replies)
        const comments = await Comment.find({
            movie: parseInt(movieId),
            parentComment: null,
            isDeleted: false,
        })
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
        const total = await Comment.countDocuments({
            movie: parseInt(movieId),
            parentComment: null,
            isDeleted: false,
        });

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

// @desc    Create a comment
// @route   POST /api/comments
// @access  Private
export const createComment = asyncHandler(
    async (req: Request, res: Response) => {
        const { movie, text, rating, isSpoiler, parentComment } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'User not authenticated');
        }

        // Validate required fields
        if (!movie || !text) {
            throw new ApiError(400, 'Movie ID and text are required');
        }

        // If it's a reply, validate parent comment exists
        if (parentComment) {
            const parent = await Comment.findById(parentComment);
            if (!parent) {
                throw new ApiError(404, 'Parent comment not found');
            }
        }

        const comment = await Comment.create({
            user: userId,
            movie: parseInt(movie),
            text: text.trim(),
            rating: rating || null,
            isSpoiler: isSpoiler || false,
            parentComment: parentComment || null,
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

// @desc    Like/Unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
export const likeComment = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'User not authenticated');
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            throw new ApiError(404, 'Comment not found');
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const hasLiked = comment.likes.some((id) => id.equals(userObjectId));
        const hasDisliked = comment.dislikes.some((id) => id.equals(userObjectId));

        if (hasLiked) {
            // Unlike
            comment.likes = comment.likes.filter((id) => !id.equals(userObjectId));
        } else {
            // Remove dislike if exists
            if (hasDisliked) {
                comment.dislikes = comment.dislikes.filter(
                    (id) => !id.equals(userObjectId)
                );
            }
            // Add like
            comment.likes.push(userObjectId);
        }

        await comment.save();

        res.status(200).json({
            success: true,
            data: {
                liked: !hasLiked,
                likesCount: comment.likes.length,
                dislikesCount: comment.dislikes.length,
            },
        });
    }
);

// @desc    Dislike/Undislike a comment
// @route   POST /api/comments/:id/dislike
// @access  Private
export const dislikeComment = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'User not authenticated');
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            throw new ApiError(404, 'Comment not found');
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const hasLiked = comment.likes.some((id) => id.equals(userObjectId));
        const hasDisliked = comment.dislikes.some((id) => id.equals(userObjectId));

        if (hasDisliked) {
            // Remove dislike
            comment.dislikes = comment.dislikes.filter(
                (id) => !id.equals(userObjectId)
            );
        } else {
            // Remove like if exists
            if (hasLiked) {
                comment.likes = comment.likes.filter((id) => !id.equals(userObjectId));
            }
            // Add dislike
            comment.dislikes.push(userObjectId);
        }

        await comment.save();

        res.status(200).json({
            success: true,
            data: {
                disliked: !hasDisliked,
                likesCount: comment.likes.length,
                dislikesCount: comment.dislikes.length,
            },
        });
    }
);

// Missing import
import mongoose from 'mongoose';
