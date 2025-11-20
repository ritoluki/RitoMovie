import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlay, FiPlus, FiCheck } from 'react-icons/fi';
import { Movie } from '@/types';
import { getImageUrl, formatRating } from '@/utils/helpers';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useMovieStore();
  const { isAuthenticated } = useAuthStore();
  const inWatchlist = isInWatchlist(movie.id);

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      return;
    }

    try {
      if (inWatchlist) {
        await removeFromWatchlist(movie.id);
      } else {
        await addToWatchlist(movie.id);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  return (
    <Link to={`/movie/${movie.id}`}>
      <motion.div
        className="movie-card group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
          <img
            src={getImageUrl(movie.poster_path, 'poster', 'medium')}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Hover Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex flex-col justify-end p-4"
          >
            <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
              {movie.title}
            </h3>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-white text-sm font-medium">
                  {formatRating(movie.vote_average)}
                </span>
              </div>
              {movie.release_date && (
                <span className="text-gray-300 text-xs">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Link
                to={`/watch/${movie.id}`}
                className="flex-1 flex items-center justify-center space-x-1 bg-white hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <FiPlay size={16} />
                <span className="text-xs">Play</span>
              </Link>
              
              {isAuthenticated && (
                <button
                  onClick={handleWatchlistClick}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded transition-colors duration-200"
                  aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {inWatchlist ? <FiCheck size={16} /> : <FiPlus size={16} />}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
};

export default MovieCard;

