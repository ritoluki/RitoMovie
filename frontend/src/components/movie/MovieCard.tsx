import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Movie } from '@/types';
import { getImageUrl } from '@/utils/helpers';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useRef, useEffect } from 'react';
import { useMovies } from '@/hooks/useMovies';
import MoviePopup from './MoviePopup';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const [shouldFetchDetails, setShouldFetchDetails] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('left');
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { useMovieDetails } = useMovies();

  // Fetch details - React Query will cache the results
  const { data: movieDetails, isLoading: detailsLoading } = useMovieDetails(movie.id);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) return;
    // Set timeout to show popup after 500ms
    hoverTimeoutRef.current = setTimeout(() => {
      setShouldFetchDetails(true);
      setShowPopup(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setShowPopup(false);

    // Clear timeout if mouse leaves before 1000ms
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  return (
    <div
      ref={cardRef}
      className={`relative transition-all duration-300 ${showPopup ? 'z-40' : 'z-0'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Show popup on desktop only (hidden on mobile) - Fixed position for full viewport */}
      {!isMobile && showPopup && (
        <MoviePopup
          movie={movie}
          movieDetails={shouldFetchDetails ? movieDetails : undefined}
          isLoading={shouldFetchDetails && detailsLoading}
          isVisible={showPopup}
          onClose={handlePopupClose}
          cardRef={cardRef}
        />
      )}

      <Link to={`/movie/${movie.id}`}>
        <motion.div
          className="movie-card group"
          whileHover={isMobile ? {} : { scale: 1.05 }}
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
          </div>

          {/* Movie Title - Always Visible */}
          <div className="mt-3 px-1">
            <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 md:group-hover:text-red-500 transition-colors duration-200">
              {movie.title}
            </h3>
            {movie.release_date && (
              <p className="text-gray-400 text-xs mt-1">
                {new Date(movie.release_date).getFullYear()}
              </p>
            )}
          </div>
        </motion.div>
      </Link>
    </div>
  );
};

export default MovieCard;

