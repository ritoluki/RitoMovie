import express from 'express';
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getNowPlayingMovies,
  getMoviesByGenre,
  searchMovies,
  getMovieDetails,
  getMovieVideos,
  getMovieCredits,
  getSimilarMovies,
  getMovieRecommendations,
  getMovieReviews,
  getGenres,
  discoverMovies,
  getMovieReleaseDates,
} from '../controllers/movieController';

const router = express.Router();

// Public routes
router.get('/trending', getTrendingMovies);
router.get('/popular', getPopularMovies);
router.get('/top-rated', getTopRatedMovies);
router.get('/upcoming', getUpcomingMovies);
router.get('/now-playing', getNowPlayingMovies);
router.get('/discover', discoverMovies);
router.get('/search', searchMovies);
router.get('/genres/list', getGenres);
router.get('/genre/:genreId', getMoviesByGenre);
router.get('/:id', getMovieDetails);
router.get('/:id/videos', getMovieVideos);
router.get('/:id/credits', getMovieCredits);
router.get('/:id/similar', getSimilarMovies);
router.get('/:id/recommendations', getMovieRecommendations);
router.get('/:id/reviews', getMovieReviews);
router.get('/:id/release-dates', getMovieReleaseDates);

export default router;

