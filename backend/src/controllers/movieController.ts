import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import * as tmdbService from '../services/tmdbService';

// Helper to get language from i18n middleware
const getLanguage = (req: Request): string => {
  return (req as { language?: string }).language || 'en';
};

const getMediaType = (req: Request): 'movie' | 'tv' => {
  return req.query.type === 'tv' ? 'tv' : 'movie';
};

const buildReleaseDatesFromTvRatings = (tvRatings: any, tvId: number) => {
  const results = (tvRatings?.results || []).map((entry: any) => ({
    iso_3166_1: entry.iso_3166_1,
    release_dates: entry.rating
      ? [
        {
          certification: entry.rating,
          descriptors: [],
          iso_639_1: '',
          note: 'TV content rating',
          release_date: '',
          type: 0,
        },
      ]
      : [],
  }));

  return {
    id: tvId,
    results,
  };
};

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
export const getTrendingMovies = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const timeWindow = (req.query.time_window as 'day' | 'week') || 'week';
    const language = getLanguage(req);
    const data = await tmdbService.getTrendingMovies(timeWindow, language);

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
    const language = getLanguage(req);
    const data = await tmdbService.getPopularMovies(page, language);

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
    const language = getLanguage(req);
    const data = await tmdbService.getTopRatedMovies(page, language);

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
    const language = getLanguage(req);
    const data = await tmdbService.getUpcomingMovies(page, language);

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
    const language = getLanguage(req);
    const data = await tmdbService.getNowPlayingMovies(page, language);

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
    const language = getLanguage(req);

    if (isNaN(genreId)) {
      throw new ApiError(400, 'Invalid genre ID');
    }

    const data = await tmdbService.getMoviesByGenre(genreId, page, language);

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
    const language = getLanguage(req);

    if (!query) {
      throw new ApiError(400, 'Search query is required');
    }

    const data = await tmdbService.searchMovies(query, page, language);

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
    const language = getLanguage(req);
    const mediaType = getMediaType(req);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = mediaType === 'tv'
      ? await tmdbService.getTvDetails(movieId, language)
      : await tmdbService.getMovieDetails(movieId, language);

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
    const language = getLanguage(req);
    const mediaType = getMediaType(req);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = mediaType === 'tv'
      ? await tmdbService.getTvVideos(movieId, language)
      : await tmdbService.getMovieVideos(movieId, language);

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
    const mediaType = getMediaType(req);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = mediaType === 'tv'
      ? await tmdbService.getTvCredits(movieId)
      : await tmdbService.getMovieCredits(movieId);

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
    const language = getLanguage(req);
    const mediaType = getMediaType(req);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = mediaType === 'tv'
      ? await tmdbService.getSimilarTvShows(movieId, page, language)
      : await tmdbService.getSimilarMovies(movieId, page, language);

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
    const language = getLanguage(req);
    const mediaType = getMediaType(req);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = mediaType === 'tv'
      ? await tmdbService.getTvRecommendations(movieId, page, language)
      : await tmdbService.getMovieRecommendations(movieId, page, language);

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
    const mediaType = getMediaType(req);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = mediaType === 'tv'
      ? await tmdbService.getTvReviews(movieId, page)
      : await tmdbService.getMovieReviews(movieId, page);

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
  async (req: Request, res: Response, __next: NextFunction) => {
    const language = getLanguage(req);
    const data = await tmdbService.getGenres(language);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get all countries
// @route   GET /api/movies/countries/list
// @access  Public
export const getCountries = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const data = await tmdbService.getCountries();

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
    const language = getLanguage(req);
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      sort_by: req.query.sort_by as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      with_genres: req.query.with_genres as string,
      with_origin_country: req.query.with_origin_country as string,
      vote_average_gte: req.query.rating_gte
        ? parseFloat(req.query.rating_gte as string)
        : undefined,
      vote_average_lte: req.query.rating_lte
        ? parseFloat(req.query.rating_lte as string)
        : undefined,
      certification_country: req.query.certification_country
        ? (req.query.certification_country as string)
        : undefined,
      certification: req.query.certification ? (req.query.certification as string) : undefined,
      certification_lte: req.query.certification_lte
        ? (req.query.certification_lte as string)
        : undefined,
      language,
    };

    const data = await tmdbService.discoverMovies(filters);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get movie release dates (for age rating/certification)
// @route   GET /api/movies/:id/release-dates
// @access  Public
export const getMovieReleaseDates = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const movieId = parseInt(req.params.id);
    const mediaType = getMediaType(req);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = mediaType === 'tv'
      ? buildReleaseDatesFromTvRatings(await tmdbService.getTvContentRatings(movieId), movieId)
      : await tmdbService.getMovieReleaseDates(movieId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

// @desc    Get movie images (backdrops, posters, logos)
// @route   GET /api/movies/:id/images
// @access  Public
export const getMovieImages = asyncHandler(
  async (req: Request, res: Response, __next: NextFunction) => {
    const movieId = parseInt(req.params.id);
    const mediaType = getMediaType(req);

    if (isNaN(movieId)) {
      throw new ApiError(400, 'Invalid movie ID');
    }

    const data = mediaType === 'tv'
      ? await tmdbService.getTvImages(movieId)
      : await tmdbService.getMovieImages(movieId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

