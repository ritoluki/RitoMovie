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
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/movie/:movieId', getMovieComments);
router.get('/:commentId/replies', getCommentReplies);

// Protected routes
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.post('/:id/dislike', protect, dislikeComment);

export default router;
