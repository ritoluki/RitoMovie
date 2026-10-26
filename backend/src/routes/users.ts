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
import { protect, requireVerifiedEmail } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { requireEnabledSetting } from '../middleware/settings';

const router = express.Router();
const watchlistEnabled = requireEnabledSetting('enable_watchlist', 'Watchlists are currently disabled.');
const ratingsEnabled = requireEnabledSetting('enable_ratings', 'Ratings are currently disabled.');

// Watchlist routes
router.get('/watchlist', protect, watchlistEnabled, getWatchlist);
router.post('/watchlist/:movieId', protect, watchlistEnabled, addToWatchlist);
router.delete('/watchlist/:movieId', protect, removeFromWatchlist);
router.get('/watchlist/:movieId/check', protect, watchlistEnabled, checkWatchlist);

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
  ratingsEnabled,
  requireVerifiedEmail,
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

