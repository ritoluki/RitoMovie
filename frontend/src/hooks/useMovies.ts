import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movieService';

export const useMovies = () => {
  const useTrending = (timeWindow: 'day' | 'week' = 'week') => {
    return useQuery({
      queryKey: ['movies', 'trending', timeWindow],
      queryFn: () => movieService.getTrending(timeWindow),
    });
  };

  const usePopular = (page: number = 1) => {
    return useQuery({
      queryKey: ['movies', 'popular', page],
      queryFn: () => movieService.getPopular(page),
    });
  };

  const useTopRated = (page: number = 1) => {
    return useQuery({
      queryKey: ['movies', 'top-rated', page],
      queryFn: () => movieService.getTopRated(page),
    });
  };

  const useMovieDetails = (movieId: number) => {
    return useQuery({
      queryKey: ['movie', movieId],
      queryFn: () => movieService.getDetails(movieId),
      enabled: !!movieId,
    });
  };

  const useMovieVideos = (movieId: number) => {
    return useQuery({
      queryKey: ['movie', movieId, 'videos'],
      queryFn: () => movieService.getVideos(movieId),
      enabled: !!movieId,
    });
  };

  const useMovieCredits = (movieId: number) => {
    return useQuery({
      queryKey: ['movie', movieId, 'credits'],
      queryFn: () => movieService.getCredits(movieId),
      enabled: !!movieId,
    });
  };

  const useSimilarMovies = (movieId: number, page: number = 1) => {
    return useQuery({
      queryKey: ['movie', movieId, 'similar', page],
      queryFn: () => movieService.getSimilar(movieId, page),
      enabled: !!movieId,
    });
  };

  const useGenres = () => {
    return useQuery({
      queryKey: ['genres'],
      queryFn: () => movieService.getGenres(),
      staleTime: Infinity, // Genres don't change often
    });
  };

  const useMoviesByGenre = (genreId: number, page: number = 1) => {
    return useQuery({
      queryKey: ['movies', 'genre', genreId, page],
      queryFn: () => movieService.getByGenre(genreId, page),
      enabled: !!genreId,
    });
  };

  const useSearchMovies = (query: string, page: number = 1) => {
    return useQuery({
      queryKey: ['movies', 'search', query, page],
      queryFn: () => movieService.search(query, page),
      enabled: query.length > 0,
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
  };
};

