import axios from 'axios';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const tmdbAxios = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

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
  const response = await tmdbAxios.get(`/trending/movie/${timeWindow}`, {
    params: { language: formatLanguage(language) },
  });
  return response.data;
};

// Get popular movies
export const getPopularMovies = async (page: number = 1, language?: string) => {
  const response = await tmdbAxios.get('/movie/popular', {
    params: { page, language: formatLanguage(language) },
  });
  return response.data;
};

// Get top rated movies
export const getTopRatedMovies = async (page: number = 1, language?: string) => {
  const response = await tmdbAxios.get('/movie/top_rated', {
    params: { page, language: formatLanguage(language) },
  });
  return response.data;
};

// Get upcoming movies
export const getUpcomingMovies = async (page: number = 1, language?: string) => {
  const response = await tmdbAxios.get('/movie/upcoming', {
    params: { page, language: formatLanguage(language) },
  });
  return response.data;
};

// Get now playing movies
export const getNowPlayingMovies = async (page: number = 1, language?: string) => {
  const response = await tmdbAxios.get('/movie/now_playing', {
    params: { page, language: formatLanguage(language) },
  });
  return response.data;
};

// Get movies by genre
export const getMoviesByGenre = async (genreId: number, page: number = 1, language?: string) => {
  const response = await tmdbAxios.get('/discover/movie', {
    params: {
      with_genres: genreId,
      page,
      sort_by: 'popularity.desc',
      language: formatLanguage(language),
    },
  });
  return response.data;
};

// Search movies
export const searchMovies = async (query: string, page: number = 1, language?: string) => {
  const response = await tmdbAxios.get('/search/movie', {
    params: {
      query,
      page,
      language: formatLanguage(language),
    },
  });
  return response.data;
};

// Get movie details
export const getMovieDetails = async (movieId: number, language?: string) => {
  const response = await tmdbAxios.get(`/movie/${movieId}`, {
    params: { language: formatLanguage(language) },
  });
  return response.data;
};

// Get movie videos (trailers, teasers, etc.)
export const getMovieVideos = async (movieId: number, language?: string) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/videos`, {
    params: { language: formatLanguage(language) },
  });
  return response.data;
};

// Get movie credits (cast and crew)
export const getMovieCredits = async (movieId: number) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/credits`);
  return response.data;
};

// Get similar movies
export const getSimilarMovies = async (movieId: number, page: number = 1, language?: string) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/similar`, {
    params: { page, language: formatLanguage(language) },
  });
  return response.data;
};

// Get movie recommendations
export const getMovieRecommendations = async (movieId: number, page: number = 1, language?: string) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/recommendations`, {
    params: { page, language: formatLanguage(language) },
  });
  return response.data;
};

// Get movie reviews
export const getMovieReviews = async (movieId: number, page: number = 1) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/reviews`, {
    params: { page },
  });
  return response.data;
};

// Get all genres
export const getGenres = async (language?: string) => {
  const response = await tmdbAxios.get('/genre/movie/list', {
    params: { language: formatLanguage(language) },
  });
  return response.data;
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
};

// Get movie release dates (for age rating/certification)
export const getMovieReleaseDates = async (movieId: number) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/release_dates`);
  return response.data;
};

// Get movie images (backdrops, posters, logos)
export const getMovieImages = async (movieId: number) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/images`);
  return response.data;
};

// Get all countries
export const getCountries = async () => {
  const response = await tmdbAxios.get('/configuration/countries');
  return response.data;
};

// ===== TV show helpers =====

export const getTvDetails = async (tvId: number, language?: string) => {
  const response = await tmdbAxios.get(`/tv/${tvId}`, {
    params: { language: formatLanguage(language) },
  });
  return response.data;
};

export const getTvVideos = async (tvId: number, language?: string) => {
  const response = await tmdbAxios.get(`/tv/${tvId}/videos`, {
    params: { language: formatLanguage(language) },
  });
  return response.data;
};

export const getTvCredits = async (tvId: number) => {
  const response = await tmdbAxios.get(`/tv/${tvId}/credits`);
  return response.data;
};

export const getSimilarTvShows = async (tvId: number, page: number = 1, language?: string) => {
  const response = await tmdbAxios.get(`/tv/${tvId}/similar`, {
    params: { page, language: formatLanguage(language) },
  });
  return response.data;
};

export const getTvRecommendations = async (tvId: number, page: number = 1, language?: string) => {
  const response = await tmdbAxios.get(`/tv/${tvId}/recommendations`, {
    params: { page, language: formatLanguage(language) },
  });
  return response.data;
};

export const getTvReviews = async (tvId: number, page: number = 1) => {
  const response = await tmdbAxios.get(`/tv/${tvId}/reviews`, {
    params: { page },
  });
  return response.data;
};

export const getTvContentRatings = async (tvId: number) => {
  const response = await tmdbAxios.get(`/tv/${tvId}/content_ratings`);
  return response.data;
};

export const getTvImages = async (tvId: number) => {
  const response = await tmdbAxios.get(`/tv/${tvId}/images`);
  return response.data;
};
