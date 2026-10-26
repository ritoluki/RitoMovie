import express from 'express';
import {
    getMovieComments,
    getCommentReplies,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
} from '../controllers/commentController';
import { protect, requireVerifiedEmail } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/movie/:movieId', getMovieComments);
router.get('/:commentId/replies', getCommentReplies);

// Protected routes
router.post('/', protect, requireVerifiedEmail, createComment);
router.put('/:id', protect, requireVerifiedEmail, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, requireVerifiedEmail, likeComment);
router.post('/:id/dislike', protect, requireVerifiedEmail, dislikeComment);

export default router;
