import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Movie } from '@/types';
import { getImageUrl } from '@/utils/helpers';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useRef, useEffect } from 'react';
import { useMovies } from '@/hooks/useMovies';
import { usePhim } from '@/hooks/usePhim';
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
  const { useMovieByTmdb } = usePhim();

  // Fetch details ONLY when hovering - React Query will cache the results
  const { data: movieDetails, isLoading: detailsLoading } = useMovieDetails(
    movie.id,
    { enabled: shouldFetchDetails }
  );

  // Fetch PhimAPI data ONLY when hovering to get quality and lang info
  const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
  const { data: phimData } = useMovieByTmdb(
    movie.id,
    mediaType,
    { enabled: shouldFetchDetails }
  );

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
          {/* Poster with Overlay Info */}
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
            <img
              src={getImageUrl(movie.poster_path, 'poster', 'medium')}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80" />

            {/* Movie Info Overlay - Bottom */}
            <div className="absolute inset-x-2 bottom-2 space-y-1">
              <h3 className="text-sm md:text-base font-bold text-white line-clamp-2 drop-shadow-lg">
                {movie.title}
              </h3>
              {movie.release_date && (
                <p className="text-xs text-gray-300 font-medium">
                  {new Date(movie.release_date).getFullYear()}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  );
};

export default MovieCard;

