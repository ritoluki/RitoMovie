import { useEffect, useState } from 'react';
import { useMovieStore } from '@/store/movieStore';
import { movieService } from '@/services/movieService';
import { Movie } from '@/types';
import MovieCard from '@/components/movie/MovieCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FiHeart } from 'react-icons/fi';

const MyList = () => {
  const { watchlist, fetchWatchlist } = useMovieStore();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (watchlist.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const moviePromises = watchlist.map((id) => movieService.getDetails(id));
        const movieDetails = await Promise.all(moviePromises);
        setMovies(movieDetails);
      } catch (error) {
        console.error('Error fetching watchlist movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [watchlist]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My List</h1>
          <p className="text-gray-400">
            {movies.length > 0
              ? `${movies.length} movie${movies.length !== 1 ? 's' : ''} in your list`
              : 'Your watchlist is empty'}
          </p>
        </div>

        {/* Movies Grid */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <FiHeart size={48} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No movies in your list yet</h2>
            <p className="text-gray-400 text-center max-w-md mb-8">
              Start adding movies to your watchlist by clicking the + button on any movie card
            </p>
            <a
              href="/browse"
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              <span>Browse Movies</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;

