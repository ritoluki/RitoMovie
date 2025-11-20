import express from 'express';
import { body } from 'express-validator';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
  getWatchHistory,
  saveWatchProgress,
  getMovieProgress,
  deleteWatchHistory,
  rateMovie,
  getMovieRating,
  getUserRatings,
  deleteRating,
  getAverageRating,
} from '../controllers/userController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

// Watchlist routes
router.get('/watchlist', protect, getWatchlist);
router.post('/watchlist/:movieId', protect, addToWatchlist);
router.delete('/watchlist/:movieId', protect, removeFromWatchlist);
router.get('/watchlist/:movieId/check', protect, checkWatchlist);

// Watch history routes
router.get('/history', protect, getWatchHistory);
router.get('/history/:movieId', protect, getMovieProgress);
router.post(
  '/history',
  protect,
  validate([
    body('movieId').isInt().withMessage('Movie ID must be a number'),
    body('progress').isNumeric().withMessage('Progress must be a number'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
  ]),
  saveWatchProgress
);
router.delete('/history/:movieId', protect, deleteWatchHistory);

// Rating routes
router.get('/ratings', protect, getUserRatings);
router.get('/ratings/:movieId', protect, getMovieRating);
router.get('/ratings/:movieId/average', getAverageRating); // Public
router.post(
  '/ratings',
  protect,
  validate([
    body('movieId').isInt().withMessage('Movie ID must be a number'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('review').optional().isLength({ max: 500 }).withMessage('Review must be less than 500 characters'),
  ]),
  rateMovie
);
router.delete('/ratings/:movieId', protect, deleteRating);

export default router;

