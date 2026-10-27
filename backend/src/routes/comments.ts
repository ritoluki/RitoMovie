import express from 'express';
import {
    getMovieComments,
    getCommentReplies,
    getCommentThread,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
    setCommentReaction,
} from '../controllers/commentController';
import { protect, requireCanComment, requireVerifiedEmail } from '../middleware/auth';
import { requireEnabledSetting } from '../middleware/settings';

const router = express.Router();

// Public routes
router.get('/movie/:movieId', getMovieComments);
router.get('/:commentId/replies', getCommentReplies);
router.get('/:id/thread', getCommentThread);

// Protected routes
const commentsEnabled = requireEnabledSetting('enable_comments', 'Comments are currently disabled.');

router.post('/', protect, commentsEnabled, requireVerifiedEmail, requireCanComment, createComment);
router.put('/:id', protect, commentsEnabled, requireVerifiedEmail, requireCanComment, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, commentsEnabled, requireVerifiedEmail, likeComment);
router.post('/:id/dislike', protect, commentsEnabled, requireVerifiedEmail, dislikeComment);
router.put('/:id/reaction', protect, commentsEnabled, requireVerifiedEmail, setCommentReaction);

export default router;
