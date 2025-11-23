import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { movieService } from '@/services/movieService';

export const useMovies = () => {
  const { i18n } = useTranslation();
  const language = i18n.language;

  const useTrending = (timeWindow: 'day' | 'week' = 'week') => {
    return useQuery({
      queryKey: ['movies', 'trending', timeWindow, language],
      queryFn: () => movieService.getTrending(timeWindow),
    });
  };

  const usePopular = (page: number = 1) => {
    return useQuery({
      queryKey: ['movies', 'popular', page, language],
      queryFn: () => movieService.getPopular(page),
    });
  };

  const useTopRated = (page: number = 1) => {
    return useQuery({
      queryKey: ['movies', 'top-rated', page, language],
      queryFn: () => movieService.getTopRated(page),
    });
  };

  type MediaType = 'movie' | 'tv';

  const useMovieDetails = (
    movieId: number,
    options?: { enabled?: boolean; mediaType?: MediaType }
  ) => {
    const mediaType = options?.mediaType ?? 'movie';
    return useQuery({
      queryKey: ['movie', mediaType, movieId, language],
      queryFn: () => movieService.getDetails(movieId, mediaType),
      enabled: Boolean(movieId) && (options?.enabled ?? true),
    });
  };

  const useMovieVideos = (movieId: number, mediaType: MediaType = 'movie') => {
    return useQuery({
      queryKey: ['movie', mediaType, movieId, 'videos', language],
      queryFn: () => movieService.getVideos(movieId, mediaType),
      enabled: !!movieId,
    });
  };

  const useMovieCredits = (movieId: number, mediaType: MediaType = 'movie') => {
    return useQuery({
      queryKey: ['movie', mediaType, movieId, 'credits', language],
      queryFn: () => movieService.getCredits(movieId, mediaType),
      enabled: !!movieId,
    });
  };

  const useSimilarMovies = (
    movieId: number,
    page: number = 1,
    mediaType: MediaType = 'movie'
  ) => {
    return useQuery({
      queryKey: ['movie', mediaType, movieId, 'similar', page, language],
      queryFn: () => movieService.getSimilar(movieId, page, mediaType),
      enabled: !!movieId,
    });
  };

  const useGenres = () => {
    return useQuery({
      queryKey: ['genres', language],
      queryFn: () => movieService.getGenres(),
      staleTime: 5 * 60 * 1000, // 5 minutes - genres need to refetch when language changes
    });
  };

  const useMoviesByGenre = (genreId: number, page: number = 1) => {
    return useQuery({
      queryKey: ['movies', 'genre', genreId, page, language],
      queryFn: () => movieService.getByGenre(genreId, page),
      enabled: !!genreId,
    });
  };

  const useSearchMovies = (query: string, page: number = 1) => {
    return useQuery({
      queryKey: ['movies', 'search', query, page, language],
      queryFn: () => movieService.search(query, page),
      enabled: query.length > 0,
    });
  };

  const useReleaseDates = (movieId: number, mediaType: MediaType = 'movie') => {
    return useQuery({
      queryKey: ['movie', mediaType, movieId, 'release-dates'],
      queryFn: () => movieService.getReleaseDates(movieId, mediaType),
      enabled: !!movieId,
      staleTime: 10 * 60 * 1000, // 10 minutes - certifications don't change often
    });
  };

  const useMovieImages = (movieId: number, mediaType: MediaType = 'movie') => {
    return useQuery({
      queryKey: ['movie', mediaType, movieId, 'images'],
      queryFn: () => movieService.getImages(movieId, mediaType),
      enabled: !!movieId,
      staleTime: 10 * 60 * 1000, // 10 minutes - images don't change often
    });
  };

  return {
    useTrending,
    usePopular,
    useTopRated,
    useMovieDetails,
    useMovieVideos,
    useMovieCredits,
    useSimilarMovies,
    useGenres,
    useMoviesByGenre,
    useSearchMovies,
    useReleaseDates,
    useMovieImages,
  };
};

