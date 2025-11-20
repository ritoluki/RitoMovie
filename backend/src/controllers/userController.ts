import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import User from '../models/User';
import WatchHistory from '../models/WatchHistory';
import Rating from '../models/Rating';

// WATCHLIST CONTROLLERS

// @desc    Get user's watchlist
// @route   GET /api/users/watchlist
// @access  Private
export const getWatchlist = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user.watchlist,
    });
  }
);

// @desc    Add movie to watchlist
// @route   POST /api/users/watchlist/:movieId
// @access  Private
export const addToWatchlist = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check if movie already in watchlist
    if (user.watchlist.includes(movieId)) {
      throw new ApiError(400, 'Movie already in watchlist');
    }

    user.watchlist.push(movieId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Movie added to watchlist',
      data: user.watchlist,
    });
  }
);

// @desc    Remove movie from watchlist
// @route   DELETE /api/users/watchlist/:movieId
// @access  Private
export const removeFromWatchlist = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Remove movie from watchlist
    user.watchlist = user.watchlist.filter((id) => id !== movieId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Movie removed from watchlist',
      data: user.watchlist,
    });
  }
);

// @desc    Check if movie is in watchlist
// @route   GET /api/users/watchlist/:movieId/check
// @access  Private
export const checkWatchlist = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const inWatchlist = user.watchlist.includes(movieId);

    res.status(200).json({
      success: true,
      data: { inWatchlist },
    });
  }
);

// WATCH HISTORY CONTROLLERS

// @desc    Get user's watch history
// @route   GET /api/users/history
// @access  Private
export const getWatchHistory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const history = await WatchHistory.find({ user: req.user.id })
      .sort('-lastWatched')
      .limit(50);

    res.status(200).json({
      success: true,
      data: history,
    });
  }
);

// @desc    Save or update watch progress
// @route   POST /api/users/history
// @access  Private
export const saveWatchProgress = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { movieId, progress, duration } = req.body;

    if (!movieId || progress === undefined || !duration) {
      throw new ApiError(400, 'Please provide movieId, progress, and duration');
    }

    // Calculate if completed (watched more than 90%)
    const completed = (progress / duration) >= 0.9;

    // Update or create watch history
    const history = await WatchHistory.findOneAndUpdate(
      { user: req.user.id, movieId },
      {
        user: req.user.id,
        movieId,
        progress,
        duration,
        lastWatched: new Date(),
        completed,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Watch progress saved',
      data: history,
    });
  }
);

// @desc    Get watch progress for a specific movie
// @route   GET /api/users/history/:movieId
// @access  Private
export const getMovieProgress = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const history = await WatchHistory.findOne({
      user: req.user.id,
      movieId,
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  }
);

// @desc    Delete watch history for a movie
// @route   DELETE /api/users/history/:movieId
// @access  Private
export const deleteWatchHistory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    await WatchHistory.findOneAndDelete({
      user: req.user.id,
      movieId,
    });

    res.status(200).json({
      success: true,
      message: 'Watch history deleted',
    });
  }
);

// RATING CONTROLLERS

// @desc    Rate a movie
// @route   POST /api/users/ratings
// @access  Private
export const rateMovie = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { movieId, rating, review } = req.body;

    if (!movieId || !rating) {
      throw new ApiError(400, 'Please provide movieId and rating');
    }

    if (rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5');
    }

    // Update or create rating
    const movieRating = await Rating.findOneAndUpdate(
      { user: req.user.id, movieId },
      {
        user: req.user.id,
        movieId,
        rating,
        review,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Movie rated successfully',
      data: movieRating,
    });
  }
);

// @desc    Get user's rating for a movie
// @route   GET /api/users/ratings/:movieId
// @access  Private
export const getMovieRating = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const rating = await Rating.findOne({
      user: req.user.id,
      movieId,
    });

    res.status(200).json({
      success: true,
      data: rating,
    });
  }
);

// @desc    Get all ratings by user
// @route   GET /api/users/ratings
// @access  Private
export const getUserRatings = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const ratings = await Rating.find({ user: req.user.id }).sort('-createdAt');

    res.status(200).json({
      success: true,
      data: ratings,
    });
  }
);

// @desc    Delete a rating
// @route   DELETE /api/users/ratings/:movieId
// @access  Private
export const deleteRating = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    await Rating.findOneAndDelete({
      user: req.user.id,
      movieId,
    });

    res.status(200).json({
      success: true,
      message: 'Rating deleted',
    });
  }
);

// @desc    Get average rating for a movie
// @route   GET /api/users/ratings/:movieId/average
// @access  Public
export const getAverageRating = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const ratings = await Rating.find({ movieId });

    if (ratings.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          average: 0,
          count: 0,
        },
      });
      return;
    }

    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const average = sum / ratings.length;

    res.status(200).json({
      success: true,
      data: {
        average: Math.round(average * 10) / 10,
        count: ratings.length,
      },
    });
  }
);

