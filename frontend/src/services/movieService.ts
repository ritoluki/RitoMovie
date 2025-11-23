import axios from '@/lib/axios';
import { Movie, MovieDetails, Video, Credits, PaginatedResponse, Genre, Country, ReleaseDatesResponse, MovieImages } from '@/types';

type MediaType = 'movie' | 'tv';

export const movieService = {
  // Get trending movies
  getTrending: async (timeWindow: 'day' | 'week' = 'week'): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/trending?time_window=${timeWindow}`
    );
    return response.data;
  },

  // Get popular movies
  getPopular: async (page: number = 1): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/popular?page=${page}`
    );
    return response.data;
  },

  // Get top rated movies
  getTopRated: async (page: number = 1): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/top-rated?page=${page}`
    );
    return response.data;
  },

  // Get upcoming movies
  getUpcoming: async (page: number = 1): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/upcoming?page=${page}`
    );
    return response.data;
  },

  // Get now playing movies
  getNowPlaying: async (page: number = 1): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/now-playing?page=${page}`
    );
    return response.data;
  },

  // Get movies by genre
  getByGenre: async (genreId: number, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/genre/${genreId}?page=${page}`
    );
    return response.data;
  },

  // Search movies
  search: async (query: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/search?q=${encodeURIComponent(query)}&page=${page}`
    );
    return response.data;
  },

  // Get movie details
  getDetails: async (movieId: number, mediaType: MediaType = 'movie'): Promise<MovieDetails> => {
    const response = await axios.get<MovieDetails>(`/movies/${movieId}`, {
      params: { type: mediaType },
    });
    return response.data;
  },

  // Get movie videos (trailers, etc.)
  getVideos: async (movieId: number, mediaType: MediaType = 'movie'): Promise<{ results: Video[] }> => {
    const response = await axios.get<{ results: Video[] }>(
      `/movies/${movieId}/videos`,
      { params: { type: mediaType } }
    );
    return response.data;
  },

  // Get movie credits (cast and crew)
  getCredits: async (movieId: number, mediaType: MediaType = 'movie'): Promise<Credits> => {
    const response = await axios.get<Credits>(`/movies/${movieId}/credits`, {
      params: { type: mediaType },
    });
    return response.data;
  },

  // Get similar movies
  getSimilar: async (movieId: number, page: number = 1, mediaType: MediaType = 'movie'): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/${movieId}/similar?page=${page}&type=${mediaType}`
    );
    return response.data;
  },

  // Get movie recommendations
  getRecommendations: async (movieId: number, page: number = 1, mediaType: MediaType = 'movie'): Promise<PaginatedResponse<Movie>> => {
    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/${movieId}/recommendations?page=${page}&type=${mediaType}`
    );
    return response.data;
  },

  // Get all genres
  getGenres: async (): Promise<{ genres: Genre[] }> => {
    const response = await axios.get<{ genres: Genre[] }>('/movies/genres/list');
    return response.data;
  },

  // Get all countries
  getCountries: async (): Promise<Country[]> => {
    const response = await axios.get<Country[]>('/movies/countries/list');
    return response.data;
  },

  // Discover movies with filters
  discover: async (filters: {
    page?: number;
    sort_by?: string;
    year?: number;
    with_genres?: string;
    with_origin_country?: string;
    rating_gte?: number;
    rating_lte?: number;
    certification_country?: string;
    certification?: string;
    certification_lte?: string;
  }): Promise<PaginatedResponse<Movie>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await axios.get<PaginatedResponse<Movie>>(
      `/movies/discover?${params.toString()}`
    );
    return response.data;
  },

  // Get movie release dates (for age rating/certification)
  getReleaseDates: async (movieId: number, mediaType: MediaType = 'movie'): Promise<ReleaseDatesResponse> => {
    const response = await axios.get<ReleaseDatesResponse>(
      `/movies/${movieId}/release-dates`,
      { params: { type: mediaType } }
    );
    return response.data;
  },

  // Get movie images (backdrops, posters, logos)
  getImages: async (movieId: number, mediaType: MediaType = 'movie'): Promise<MovieImages> => {
    const response = await axios.get<MovieImages>(
      `/movies/${movieId}/images`,
      { params: { type: mediaType } }
    );
    return response.data;
  },
};

