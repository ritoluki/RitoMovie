import { useParams, Link } from 'react-router-dom';
import { useMovies } from '@/hooks/useMovies';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FiArrowLeft, FiInfo } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0');
  
  const { useMovieDetails, useMovieVideos } = useMovies();
  const { data: movie, isLoading: movieLoading } = useMovieDetails(movieId);
  const { data: videos } = useMovieVideos(movieId);

  if (movieLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Movie not found</p>
      </div>
    );
  }

  // Get trailer for demo (since we don't have actual movie files)
  const trailer = videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-20 left-4 md:left-8 z-50"
      >
        <Link
          to={`/movie/${movie.id}`}
          className="inline-flex items-center space-x-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiArrowLeft size={20} />
          <span>Back</span>
        </Link>
      </motion.div>

      {/* Video Player Container */}
      <div className="container mx-auto px-0 pt-16">
        <div className="aspect-video bg-gray-900 relative">
          {trailer ? (
            // Show trailer for demo
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title={movie.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            // Placeholder when no trailer available
            <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
              <FiInfo size={64} className="mb-4 text-gray-600" />
              <h2 className="text-2xl font-bold mb-2">{movie.title}</h2>
              <p className="text-gray-400 text-center max-w-md mb-4">
                Full movie streaming requires actual video files. Currently showing trailer demo.
              </p>
              <p className="text-sm text-gray-500">
                To enable full streaming, upload video files through the admin panel.
              </p>
            </div>
          )}
        </div>

        {/* Movie Info Below Player */}
        <div className="container mx-auto px-4 md:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {movie.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
            <span className="flex items-center space-x-2">
              <span className="text-yellow-400">★</span>
              <span>{movie.vote_average.toFixed(1)}</span>
            </span>
            {movie.release_date && (
              <span>{new Date(movie.release_date).getFullYear()}</span>
            )}
            {movie.runtime && (
              <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
            )}
          </div>

          <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
            {movie.overview}
          </p>

          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-gray-800 text-white text-sm rounded-full"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watch;

