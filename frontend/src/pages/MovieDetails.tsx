import { useParams, Link } from 'react-router-dom';
import { FiPlay, FiPlus, FiCheck, FiClock, FiCalendar, FiStar } from 'react-icons/fi';
import { useMovies } from '@/hooks/useMovies';
import { useAuthStore } from '@/store/authStore';
import { useMovieStore } from '@/store/movieStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MovieRow from '@/components/movie/MovieRow';
import { getImageUrl, formatRuntime, formatDate, getYouTubeEmbedUrl } from '@/utils/helpers';
import { motion } from 'framer-motion';

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0');
  
  const { useMovieDetails, useMovieVideos, useMovieCredits, useSimilarMovies } = useMovies();
  
  const { data: movie, isLoading: movieLoading } = useMovieDetails(movieId);
  const { data: videos } = useMovieVideos(movieId);
  const { data: credits } = useMovieCredits(movieId);
  const { data: similar } = useSimilarMovies(movieId);
  
  const { isAuthenticated } = useAuthStore();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useMovieStore();
  
  const inWatchlist = isInWatchlist(movieId);

  const handleWatchlistClick = async () => {
    if (!isAuthenticated) return;
    
    try {
      if (inWatchlist) {
        await removeFromWatchlist(movieId);
      } else {
        await addToWatchlist(movieId);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  if (movieLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-white">Movie not found</p>
      </div>
    );
  }

  const trailer = videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const cast = credits?.cast.slice(0, 10) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh]">
        <div className="absolute inset-0">
          <img
            src={getImageUrl(movie.backdrop_path, 'backdrop', 'original')}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        </div>

        <div className="relative h-full container mx-auto px-4 md:px-8 flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-none"
            >
              <img
                src={getImageUrl(movie.poster_path, 'poster', 'large')}
                alt={movie.title}
                className="w-48 md:w-64 rounded-lg shadow-2xl"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 space-y-4"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-gray-300 italic text-lg">{movie.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-gray-300">
                <div className="flex items-center space-x-2">
                  <FiStar className="text-yellow-400" size={20} />
                  <span className="font-semibold text-white">
                    {movie.vote_average.toFixed(1)}
                  </span>
                  <span className="text-sm">({movie.vote_count} votes)</span>
                </div>

                {movie.runtime && (
                  <div className="flex items-center space-x-2">
                    <FiClock size={18} />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}

                {movie.release_date && (
                  <div className="flex items-center space-x-2">
                    <FiCalendar size={18} />
                    <span>{formatDate(movie.release_date)}</span>
                  </div>
                )}
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-gray-800/80 backdrop-blur-sm text-white text-sm rounded-full"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to={`/watch/${movie.id}`}
                  className="inline-flex items-center space-x-2 bg-white hover:bg-gray-200 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
                >
                  <FiPlay size={20} />
                  <span>Play</span>
                </Link>

                {isAuthenticated && (
                  <button
                    onClick={handleWatchlistClick}
                    className="inline-flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold px-8 py-3 rounded-lg backdrop-blur-sm transition-colors duration-200"
                  >
                    {inWatchlist ? <FiCheck size={20} /> : <FiPlus size={20} />}
                    <span>{inWatchlist ? 'In My List' : 'Add to List'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 md:px-8 py-12 space-y-12">
        {/* Overview */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-gray-300 text-lg leading-relaxed">{movie.overview}</p>
        </section>

        {/* Trailer */}
        {trailer && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Trailer</h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-800">
              <iframe
                width="100%"
                height="100%"
                src={getYouTubeEmbedUrl(trailer.key)}
                title={trailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cast.map((person) => (
                <div key={person.id} className="text-center">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                    <img
                      src={getImageUrl(person.profile_path, 'profile', 'medium')}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-white font-medium text-sm">{person.name}</p>
                  <p className="text-gray-400 text-xs">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Movies */}
        {similar?.results && similar.results.length > 0 && (
          <section>
            <MovieRow title="Similar Movies" movies={similar.results} />
          </section>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;

