import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiPlus, FiCheck, FiInfo } from 'react-icons/fi';
import { Movie, MovieDetails, Genre } from '@/types';
import { getImageUrl, formatRating, formatRuntime } from '@/utils/helpers';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface MoviePopupProps {
  movie: Movie;
  movieDetails?: MovieDetails;
  isLoading: boolean;
  isVisible: boolean;
  onClose: () => void;
  cardRef: React.RefObject<HTMLDivElement>;
}

const MoviePopup = ({ movie, movieDetails, isLoading, isVisible, onClose, cardRef }: MoviePopupProps) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useMovieStore();
  const { isAuthenticated } = useAuthStore();
  const inWatchlist = isInWatchlist(movie.id);
  const { t } = useTranslation();

  // Get age rating based on vote average (simplified)
  const getAgeRating = () => {
    if (movie.adult) return 'T18';
    if (movie.vote_average < 6) return 'T13';
    if (movie.vote_average < 7.5) return 'T16';
    return 'T13';
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) return;

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

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  // Calculate popup position based on card position
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    if (isVisible && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const popupWidth = 450;
      const popupHeight = 500; // Approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const overlap = 40; // Overlap with card to prevent losing hover

      let top = cardRect.top;
      let left = cardRect.left;

      // Horizontal positioning - overlap with card to maintain hover
      if (cardRect.right + popupWidth - overlap <= viewportWidth) {
        // Show on right of card with overlap
        left = cardRect.right - overlap;
      } else if (cardRect.left - popupWidth + overlap >= 0) {
        // Show on left of card with overlap
        left = cardRect.left - popupWidth + overlap;
      } else {
        // Show aligned with card, overlapping
        left = Math.min(cardRect.left, viewportWidth - popupWidth - 20);
        left = Math.max(20, left);
      }

      // Vertical positioning - ensure popup doesn't go off screen
      if (top + popupHeight > viewportHeight) {
        top = Math.max(20, viewportHeight - popupHeight - 20);
      }
      top = Math.max(20, top); // Minimum 20px from top

      setPosition({ top, left });
      setIsPositioned(true);
    }
  }, [isVisible, cardRef]);

  return (
    <AnimatePresence>
      {isVisible && isPositioned && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ 
            duration: 0.25, 
            ease: [0.4, 0, 0.2, 1],
            opacity: { duration: 0.2 }
          }}
          className="fixed z-[9999] w-[450px] max-w-[90vw] bg-gray-900 rounded-xl shadow-2xl backdrop-blur-xl border-2 border-white/20"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            boxShadow: '0 25px 70px -12px rgba(0, 0, 0, 0.9), 0 10px 25px -5px rgba(0, 0, 0, 0.7)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Backdrop Image Header */}
          <div className="relative h-68 overflow-hidden rounded-t-xl">
            <img
              src={getImageUrl(movie.backdrop_path || movie.poster_path, 'backdrop', 'large')}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
            
            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-bold rounded border border-white/30">
                {getAgeRating()}
              </span>
              <span className="px-2.5 py-1 bg-yellow-500/90 backdrop-blur-sm text-gray-900 text-xs font-bold rounded">
                IMDb {formatRating(movie.vote_average)}
              </span>
            </div>

            {/* Action Buttons Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
              <Link
                to={`/watch/${movie.id}`}
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 flex-1 bg-white hover:bg-gray-200 text-gray-900 font-bold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg"
              >
                <FiPlay size={18} />
                <span className="text-sm">{t('movie.watchNow')}</span>
              </Link>
              
              {isAuthenticated && (
                <button
                  onClick={handleWatchlistClick}
                  className="p-2.5 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 shadow-lg"
                  aria-label={inWatchlist ? t('movie.removeFromList') : t('movie.addToList')}
                >
                  {inWatchlist ? <FiCheck size={20} /> : <FiPlus size={20} />}
                </button>
              )}

              <Link
                to={`/movie/${movie.id}`}
                onClick={handleLinkClick}
                className="p-2.5 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 shadow-lg"
                aria-label={t('movie.moreInfo')}
              >
                <FiInfo size={20} />
              </Link>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-5 space-y-3 rounded-b-xl overflow-hidden">
            {/* Title */}
            <div>
              <h3 className="text-white font-bold text-lg line-clamp-2 leading-tight">
                {movie.title}
              </h3>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                  {movie.original_title}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 text-sm text-gray-300">
              {movie.release_date && (
                <>
                  <span className="font-semibold text-green-400">
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                  <span className="text-gray-500">•</span>
                </>
              )}
              
              {movieDetails?.runtime && !isLoading && (
                <>
                  <span>{formatRuntime(movieDetails.runtime)}</span>
                  <span className="text-gray-500">•</span>
                </>
              )}

              <span className="px-2 py-0.5 bg-gray-700/50 text-white text-xs font-medium rounded border border-gray-600/50">
                CAM
              </span>
            </div>

            {/* Genres */}
            {movieDetails?.genres && movieDetails.genres.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-1.5">
                {movieDetails.genres.slice(0, 3).map((genre: Genre) => (
                  <span
                    key={genre.id}
                    className="px-2 py-0.5 bg-gray-800/80 text-gray-300 text-xs font-medium rounded border border-gray-700/50"
                  >
                    {genre.name}
                  </span>
                ))}
                {movieDetails.genres.length > 3 && (
                  <span className="px-2 py-0.5 text-gray-400 text-xs font-medium">
                    +{movieDetails.genres.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Loading state for genres */}
            {isLoading && (
              <div className="flex gap-1.5">
                <div className="h-5 w-16 bg-gray-800 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-800 rounded animate-pulse" />
                <div className="h-5 w-14 bg-gray-800 rounded animate-pulse" />
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">
                {movie.overview}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MoviePopup;

