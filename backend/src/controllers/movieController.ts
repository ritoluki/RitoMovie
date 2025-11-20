import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import * as tmdbService from '../services/tmdbService';

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
export const getTrendingMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const timeWindow = (req.query.time_window as 'day' | 'week') || 'week';
    const data = await tmdbService.getTrendingMovies(timeWindow);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get popular movies
// @route   GET /api/movies/popular
// @access  Public
export const getPopularMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const data = await tmdbService.getPopularMovies(page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get top rated movies
// @route   GET /api/movies/top-rated
// @access  Public
export const getTopRatedMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const data = await tmdbService.getTopRatedMovies(page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get upcoming movies
// @route   GET /api/movies/upcoming
// @access  Public
export const getUpcomingMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const data = await tmdbService.getUpcomingMovies(page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get now playing movies
// @route   GET /api/movies/now-playing
// @access  Public
export const getNowPlayingMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const data = await tmdbService.getNowPlayingMovies(page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get movies by genre
// @route   GET /api/movies/genre/:genreId
// @access  Public
export const getMoviesByGenre = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const genreId = parseInt(req.params.genreId);
    const page = parseInt(req.query.page as string) || 1;

    if (isNaN(genreId)) {
      throw new ApiError(400, 'Invalid genre ID');
    }

    const data = await tmdbService.getMoviesByGenre(genreId, page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Search movies
// @route   GET /api/movies/search
// @access  Public
export const searchMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;

    if (!query) {
      throw new ApiError(400, 'Search query is required');
    }

    const data = await tmdbService.searchMovies(query, page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get movie details
// @route   GET /api/movies/:id
// @access  Public
export const getMovieDetails = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const movieId = parseInt(req.params.id);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = await tmdbService.getMovieDetails(movieId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get movie videos
// @route   GET /api/movies/:id/videos
// @access  Public
export const getMovieVideos = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const movieId = parseInt(req.params.id);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = await tmdbService.getMovieVideos(movieId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get movie credits
// @route   GET /api/movies/:id/credits
// @access  Public
export const getMovieCredits = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const movieId = parseInt(req.params.id);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = await tmdbService.getMovieCredits(movieId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get similar movies
// @route   GET /api/movies/:id/similar
// @access  Public
export const getSimilarMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = await tmdbService.getSimilarMovies(movieId, page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get movie recommendations
// @route   GET /api/movies/:id/recommendations
// @access  Public
export const getMovieRecommendations = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = await tmdbService.getMovieRecommendations(movieId, page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get movie reviews
// @route   GET /api/movies/:id/reviews
// @access  Public
export const getMovieReviews = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = await tmdbService.getMovieReviews(movieId, page);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get all genres
// @route   GET /api/movies/genres/list
// @access  Public
export const getGenres = asyncHandler(
  async (_req: Request, res: Response, __next: NextFunction) => {
    const data = await tmdbService.getGenres();

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Discover movies with filters
// @route   GET /api/movies/discover
// @access  Public
export const discoverMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      sort_by: req.query.sort_by as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      with_genres: req.query.with_genres as string,
      vote_average_gte: req.query.rating_gte
        ? parseFloat(req.query.rating_gte as string)
        : undefined,
      vote_average_lte: req.query.rating_lte
        ? parseFloat(req.query.rating_lte as string)
        : undefined,
    };

    const data = await tmdbService.discoverMovies(filters);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

