import axios from 'axios';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const tmdbAxios = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Get trending movies
export const getTrendingMovies = async (timeWindow: 'day' | 'week' = 'week') => {
  const response = await tmdbAxios.get(`/trending/movie/${timeWindow}`);
  return response.data;
};

// Get popular movies
export const getPopularMovies = async (page: number = 1) => {
  const response = await tmdbAxios.get('/movie/popular', {
    params: { page },
  });
  return response.data;
};

// Get top rated movies
export const getTopRatedMovies = async (page: number = 1) => {
  const response = await tmdbAxios.get('/movie/top_rated', {
    params: { page },
  });
  return response.data;
};

// Get upcoming movies
export const getUpcomingMovies = async (page: number = 1) => {
  const response = await tmdbAxios.get('/movie/upcoming', {
    params: { page },
  });
  return response.data;
};

// Get now playing movies
export const getNowPlayingMovies = async (page: number = 1) => {
  const response = await tmdbAxios.get('/movie/now_playing', {
    params: { page },
  });
  return response.data;
};

// Get movies by genre
export const getMoviesByGenre = async (genreId: number, page: number = 1) => {
  const response = await tmdbAxios.get('/discover/movie', {
    params: {
      with_genres: genreId,
      page,
      sort_by: 'popularity.desc',
    },
  });
  return response.data;
};

// Search movies
export const searchMovies = async (query: string, page: number = 1) => {
  const response = await tmdbAxios.get('/search/movie', {
    params: {
      query,
      page,
    },
  });
  return response.data;
};

// Get movie details
export const getMovieDetails = async (movieId: number) => {
  const response = await tmdbAxios.get(`/movie/${movieId}`);
  return response.data;
};

// Get movie videos (trailers, teasers, etc.)
export const getMovieVideos = async (movieId: number) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/videos`);
  return response.data;
};

// Get movie credits (cast and crew)
export const getMovieCredits = async (movieId: number) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/credits`);
  return response.data;
};

// Get similar movies
export const getSimilarMovies = async (movieId: number, page: number = 1) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/similar`, {
    params: { page },
  });
  return response.data;
};

// Get movie recommendations
export const getMovieRecommendations = async (movieId: number, page: number = 1) => {
  const response = await tmdbAxios.get(`/movie/${movieId}/recommendations`, {
    params: { page },
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
export const getGenres = async () => {
  const response = await tmdbAxios.get('/genre/movie/list');
  return response.data;
};

// Discover movies with advanced filters
export const discoverMovies = async (filters: {
  page?: number;
  sort_by?: string;
  year?: number;
  with_genres?: string;
  vote_average_gte?: number;
  vote_average_lte?: number;
}) => {
  const response = await tmdbAxios.get('/discover/movie', {
    params: {
      page: filters.page || 1,
      sort_by: filters.sort_by || 'popularity.desc',
      ...(filters.year && { primary_release_year: filters.year }),
      ...(filters.with_genres && { with_genres: filters.with_genres }),
      ...(filters.vote_average_gte && {
        'vote_average.gte': filters.vote_average_gte,
      }),
      ...(filters.vote_average_lte && {
        'vote_average.lte': filters.vote_average_lte,
      }),
    },
  });
  return response.data;
};

