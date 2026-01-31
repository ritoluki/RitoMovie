import axios from 'axios';
import { apiCache, CACHE_TTL } from '../utils/cache';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const tmdbAxios = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000, // 10 second timeout
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Helper to generate cache key
const getCacheKey = (endpoint: string, params?: Record<string, unknown>): string => {
  const paramStr = params ? JSON.stringify(params) : '';
  return `tmdb:${endpoint}:${paramStr}`;
};

// Helper to format language for TMDB API
const formatLanguage = (lang?: string): string => {
  if (!lang) return 'en-US';

  // Convert i18n language codes to TMDB format
  const languageMap: Record<string, string> = {
    'en': 'en-US',
    'vi': 'vi-VN',
  };

  return languageMap[lang] || languageMap[lang.split('-')[0]] || 'en-US';
};

// Get trending movies
export const getTrendingMovies = async (timeWindow: 'day' | 'week' = 'week', language?: string) => {
  const cacheKey = getCacheKey(`trending/${timeWindow}`, { language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/trending/movie/${timeWindow}`, {
      params: { language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get popular movies
export const getPopularMovies = async (page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('popular', { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/movie/popular', {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get top rated movies
export const getTopRatedMovies = async (page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('top_rated', { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/movie/top_rated', {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get upcoming movies
export const getUpcomingMovies = async (page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('upcoming', { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/movie/upcoming', {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get now playing movies
export const getNowPlayingMovies = async (page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('now_playing', { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/movie/now_playing', {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get movies by genre
export const getMoviesByGenre = async (genreId: number, page: number = 1, language?: string) => {
  const cacheKey = getCacheKey(`genre/${genreId}`, { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc',
        language: formatLanguage(language),
      },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Search movies
export const searchMovies = async (query: string, page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('search', { query, page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/search/movie', {
      params: {
        query,
        page,
        language: formatLanguage(language),
      },
    });
    return response.data;
  }, CACHE_TTL.SHORT); // Shorter cache for search results
};

// Get movie details
export const getMovieDetails = async (movieId: number, language?: string) => {
  const cacheKey = getCacheKey(`movie/${movieId}`, { language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/movie/${movieId}`, {
      params: { language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.LONG); // Longer cache for movie details
};

// Get movie videos (trailers, teasers, etc.)
export const getMovieVideos = async (movieId: number, language?: string) => {
  const cacheKey = getCacheKey(`movie/${movieId}/videos`, { language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/movie/${movieId}/videos`, {
      params: { language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.LONG);
};

// Get movie credits (cast and crew)
export const getMovieCredits = async (movieId: number) => {
  const cacheKey = getCacheKey(`movie/${movieId}/credits`);
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/movie/${movieId}/credits`);
    return response.data;
  }, CACHE_TTL.HOUR); // Credits rarely change
};

// Get similar movies
export const getSimilarMovies = async (movieId: number, page: number = 1, language?: string) => {
  const cacheKey = getCacheKey(`movie/${movieId}/similar`, { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/movie/${movieId}/similar`, {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get movie recommendations
export const getMovieRecommendations = async (movieId: number, page: number = 1, language?: string) => {
  const cacheKey = getCacheKey(`movie/${movieId}/recommendations`, { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/movie/${movieId}/recommendations`, {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get movie reviews
export const getMovieReviews = async (movieId: number, page: number = 1) => {
  const cacheKey = getCacheKey(`movie/${movieId}/reviews`, { page });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/movie/${movieId}/reviews`, {
      params: { page },
    });
    return response.data;
  }, CACHE_TTL.SHORT); // Reviews update more frequently
};

// Get all genres
export const getGenres = async (language?: string) => {
  const cacheKey = getCacheKey('genres', { language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/genre/movie/list', {
      params: { language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.DAY); // Genres rarely change
};

// Discover movies with advanced filters
export const discoverMovies = async (filters: {
  page?: number;
  sort_by?: string;
  year?: number;
  with_genres?: string;
  with_origin_country?: string;
  vote_average_gte?: number;
  vote_average_lte?: number;
  language?: string;
  certification_country?: string;
  certification?: string;
  certification_lte?: string;
}) => {
  const cacheKey = getCacheKey('discover', filters);
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/discover/movie', {
      params: {
        page: filters.page || 1,
        sort_by: filters.sort_by || 'popularity.desc',
        language: formatLanguage(filters.language),
        ...(filters.year && { primary_release_year: filters.year }),
        ...(filters.with_genres && { with_genres: filters.with_genres }),
        ...(filters.with_origin_country && {
          with_origin_country: filters.with_origin_country,
        }),
        ...(filters.vote_average_gte && {
          'vote_average.gte': filters.vote_average_gte,
        }),
        ...(filters.vote_average_lte && {
          'vote_average.lte': filters.vote_average_lte,
        }),
        ...(filters.certification_country && {
          certification_country: filters.certification_country,
        }),
        ...(filters.certification && { certification: filters.certification }),
        ...(filters.certification_lte && {
          'certification.lte': filters.certification_lte,
        }),
      },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get movie release dates (for age rating/certification)
export const getMovieReleaseDates = async (movieId: number) => {
  const cacheKey = getCacheKey(`movie/${movieId}/release_dates`);
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/movie/${movieId}/release_dates`);
    return response.data;
  }, CACHE_TTL.HOUR);
};

// Get movie images (backdrops, posters, logos)
export const getMovieImages = async (movieId: number) => {
  const cacheKey = getCacheKey(`movie/${movieId}/images`);
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/movie/${movieId}/images`);
    return response.data;
  }, CACHE_TTL.HOUR);
};

// Get all countries
export const getCountries = async () => {
  const cacheKey = getCacheKey('countries');
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/configuration/countries');
    return response.data;
  }, CACHE_TTL.DAY);
};

// ===== TV Series endpoints =====

// Get popular TV series
export const getPopularTvShows = async (page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('tv/popular', { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/tv/popular', {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get top rated TV series
export const getTopRatedTvShows = async (page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('tv/top_rated', { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/tv/top_rated', {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get on the air TV series (currently airing)
export const getOnTheAirTvShows = async (page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('tv/on_the_air', { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/tv/on_the_air', {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// Get airing today TV series
export const getAiringTodayTvShows = async (page: number = 1, language?: string) => {
  const cacheKey = getCacheKey('tv/airing_today', { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/tv/airing_today', {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.SHORT); // Short cache since it changes daily
};

// Get TV series by genre
export const getTvShowsByGenre = async (genreId: number, page: number = 1, language?: string) => {
  const cacheKey = getCacheKey(`tv/genre/${genreId}`, { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get('/discover/tv', {
      params: {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc',
        language: formatLanguage(language),
      },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

// ===== TV show helpers =====

export const getTvDetails = async (tvId: number, language?: string) => {
  const cacheKey = getCacheKey(`tv/${tvId}`, { language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/tv/${tvId}`, {
      params: { language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.LONG);
};

export const getTvVideos = async (tvId: number, language?: string) => {
  const cacheKey = getCacheKey(`tv/${tvId}/videos`, { language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/tv/${tvId}/videos`, {
      params: { language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.LONG);
};

export const getTvCredits = async (tvId: number) => {
  const cacheKey = getCacheKey(`tv/${tvId}/credits`);
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/tv/${tvId}/credits`);
    return response.data;
  }, CACHE_TTL.HOUR);
};

export const getSimilarTvShows = async (tvId: number, page: number = 1, language?: string) => {
  const cacheKey = getCacheKey(`tv/${tvId}/similar`, { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/tv/${tvId}/similar`, {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

export const getTvRecommendations = async (tvId: number, page: number = 1, language?: string) => {
  const cacheKey = getCacheKey(`tv/${tvId}/recommendations`, { page, language });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/tv/${tvId}/recommendations`, {
      params: { page, language: formatLanguage(language) },
    });
    return response.data;
  }, CACHE_TTL.MEDIUM);
};

export const getTvReviews = async (tvId: number, page: number = 1) => {
  const cacheKey = getCacheKey(`tv/${tvId}/reviews`, { page });
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/tv/${tvId}/reviews`, {
      params: { page },
    });
    return response.data;
  }, CACHE_TTL.SHORT);
};

export const getTvContentRatings = async (tvId: number) => {
  const cacheKey = getCacheKey(`tv/${tvId}/content_ratings`);
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/tv/${tvId}/content_ratings`);
    return response.data;
  }, CACHE_TTL.HOUR);
};

export const getTvImages = async (tvId: number) => {
  const cacheKey = getCacheKey(`tv/${tvId}/images`);
  
  return apiCache.getOrSet(cacheKey, async () => {
    const response = await tmdbAxios.get(`/tv/${tvId}/images`);
    return response.data;
  }, CACHE_TTL.HOUR);
};
