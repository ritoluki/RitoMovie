import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import Movie from '../../models/Movie';
import Comment from '../../models/Comment';
import Rating from '../../models/Rating';
import WatchHistory from '../../models/WatchHistory';
import { logAdminAction } from '../../middleware/adminAuth';

/**
 * @desc    List all movies with pagination, search, and filters
 * @route   GET /api/admin/movies
 * @access  Admin
 */
export const listMovies = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    search,
    genre,
    year,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Build query
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { original_title: { $regex: search, $options: 'i' } },
    ];
  }

  if (genre) {
    query.genres = genre;
  }

  if (year) {
    query.release_date = { $regex: `^${year}` };
  }

  if (status === 'featured') {
    query.isFeatured = true;
  } else if (status === 'trending') {
    query.isTrending = true;
  }

  // Build sort
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const movies = await Movie.find(query)
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sort);

  const total = await Movie.countDocuments(query);

  res.status(200).json({
    success: true,
    data: movies,
    pagination: {
      page: +page,
      limit: +limit,
      total,
      pages: Math.ceil(total / +limit),
    },
  });
});

/**
 * @desc    Get movie details
 * @route   GET /api/admin/movies/:id
 * @access  Admin
 */
export const getMovieDetails = asyncHandler(async (req: Request, res: Response) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    throw new ApiError(404, 'Movie not found');
  }

  // Get movie stats
  const [commentsCount, ratingsStats, viewsCount] = await Promise.all([
    Comment.countDocuments({ movie: movie._id }),
    Rating.aggregate([
      { $match: { movie: movie._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]),
    WatchHistory.countDocuments({ movie: movie._id }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      movie,
      stats: {
        commentsCount,
        averageRating: ratingsStats[0]?.averageRating || 0,
        totalRatings: ratingsStats[0]?.totalRatings || 0,
        viewsCount,
      },
    },
  });
});

/**
 * @desc    Create movie
 * @route   POST /api/admin/movies
 * @access  Admin
 */
export const createMovie = asyncHandler(async (req: Request, res: Response) => {
  const movieData = req.body;

  const movie = await Movie.create(movieData);

  await logAdminAction(req, 'CREATE', 'MOVIE', movie._id.toString(), {
    title: movie.title,
  });

  res.status(201).json({
    success: true,
    data: movie,
    message: 'Movie created successfully',
  });
});

/**
 * @desc    Update movie
 * @route   PUT /api/admin/movies/:id
 * @access  Admin
 */
export const updateMovie = asyncHandler(async (req: Request, res: Response) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    throw new ApiError(404, 'Movie not found');
  }

  const oldTitle = movie.title;
  const updatedMovie = await Movie.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  await logAdminAction(req, 'UPDATE', 'MOVIE', movie._id.toString(), {
    oldTitle,
    newTitle: updatedMovie?.title,
    updatedFields: Object.keys(req.body),
  });

  res.status(200).json({
    success: true,
    data: updatedMovie,
    message: 'Movie updated successfully',
  });
});

/**
 * @desc    Delete movie
 * @route   DELETE /api/admin/movies/:id
 * @access  Admin
 */
export const deleteMovie = asyncHandler(async (req: Request, res: Response) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    throw new ApiError(404, 'Movie not found');
  }

  await logAdminAction(req, 'DELETE', 'MOVIE', movie._id.toString(), {
    title: movie.title,
  });

  await Movie.findByIdAndDelete(req.params.id);

  // Also delete related data
  await Promise.all([
    Comment.deleteMany({ movie: movie._id }),
    Rating.deleteMany({ movie: movie._id }),
    WatchHistory.deleteMany({ movie: movie._id }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Movie and related data deleted successfully',
  });
});

/**
 * @desc    Set movie as featured
 * @route   POST /api/admin/movies/:id/feature
 * @access  Admin
 */
export const setFeatured = asyncHandler(async (req: Request, res: Response) => {
  const { isFeatured = true } = req.body;

  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    { isFeatured },
    { new: true }
  );

  if (!movie) {
    throw new ApiError(404, 'Movie not found');
  }

  await logAdminAction(req, 'UPDATE', 'MOVIE', movie._id.toString(), {
    action: isFeatured ? 'Set as featured' : 'Removed from featured',
  });

  res.status(200).json({
    success: true,
    data: movie,
    message: isFeatured ? 'Movie set as featured' : 'Movie removed from featured',
  });
});

/**
 * @desc    Set movie as trending
 * @route   POST /api/admin/movies/:id/trending
 * @access  Admin
 */
export const setTrending = asyncHandler(async (req: Request, res: Response) => {
  const { isTrending = true } = req.body;

  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    { isTrending },
    { new: true }
  );

  if (!movie) {
    throw new ApiError(404, 'Movie not found');
  }

  await logAdminAction(req, 'UPDATE', 'MOVIE', movie._id.toString(), {
    action: isTrending ? 'Set as trending' : 'Removed from trending',
  });

  res.status(200).json({
    success: true,
    data: movie,
    message: isTrending ? 'Movie set as trending' : 'Movie removed from trending',
  });
});

/**
 * @desc    Import movie from TMDB
 * @route   POST /api/admin/movies/import-tmdb
 * @access  Admin
 */
export const importFromTMDB = asyncHandler(async (req: Request, res: Response) => {
  const { tmdbId } = req.body;

  if (!tmdbId) {
    throw new ApiError(400, 'TMDB ID is required');
  }

  // Check if movie already exists
  const existingMovie = await Movie.findOne({ tmdb_id: tmdbId });
  if (existingMovie) {
    throw new ApiError(400, 'Movie already exists in database');
  }

  // TODO: Implement TMDB API call to fetch movie data
  // For now, return a placeholder response
  res.status(200).json({
    success: true,
    message: 'TMDB import feature coming soon',
    tmdbId,
  });
});

/**
 * @desc    Bulk action on movies
 * @route   POST /api/admin/movies/bulk-action
 * @access  Admin
 */
export const bulkAction = asyncHandler(async (req: Request, res: Response) => {
  const { action, movieIds } = req.body;

  if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
    throw new ApiError(400, 'No movies selected');
  }

  const validActions = ['delete', 'feature', 'unfeature', 'trending', 'untrending'];
  if (!validActions.includes(action)) {
    throw new ApiError(400, `Invalid action. Valid actions: ${validActions.join(', ')}`);
  }

  let result;

  switch (action) {
    case 'delete':
      result = await Movie.deleteMany({ _id: { $in: movieIds } });
      // Also delete related data
      await Promise.all([
        Comment.deleteMany({ movie: { $in: movieIds } }),
        Rating.deleteMany({ movie: { $in: movieIds } }),
        WatchHistory.deleteMany({ movie: { $in: movieIds } }),
      ]);
      break;
    case 'feature':
      result = await Movie.updateMany(
        { _id: { $in: movieIds } },
        { isFeatured: true }
      );
      break;
    case 'unfeature':
      result = await Movie.updateMany(
        { _id: { $in: movieIds } },
        { isFeatured: false }
      );
      break;
    case 'trending':
      result = await Movie.updateMany(
        { _id: { $in: movieIds } },
        { isTrending: true }
      );
      break;
    case 'untrending':
      result = await Movie.updateMany(
        { _id: { $in: movieIds } },
        { isTrending: false }
      );
      break;
  }

  await logAdminAction(req, 'UPDATE', 'MOVIE', undefined, {
    bulkAction: action,
    movieIds,
    modifiedCount: result?.modifiedCount || result?.deletedCount,
  });

  res.status(200).json({
    success: true,
    message: `Bulk ${action} completed`,
    modifiedCount: result?.modifiedCount || result?.deletedCount,
  });
});

/**
 * @desc    Get all genres
 * @route   GET /api/admin/genres
 * @access  Admin
 */
export const listGenres = asyncHandler(async (req: Request, res: Response) => {
  const genres = await Movie.distinct('genres');

  // Get count for each genre
  const genresWithCount = await Movie.aggregate([
    { $unwind: '$genres' },
    { $group: { _id: '$genres', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: genresWithCount,
  });
});
