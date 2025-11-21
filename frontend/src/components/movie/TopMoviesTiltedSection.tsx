import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Movie } from '@/types';
import { getImageUrl, formatRating } from '@/utils/helpers';
import { useMovies } from '@/hooks/useMovies';
import MoviePopup from './MoviePopup';

interface TopMoviesTiltedSectionProps {
  title: string;
  movies: Movie[];
}

const TopMoviesTiltedSection = ({ title, movies }: TopMoviesTiltedSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
      const newScrollPosition =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth',
      });
    }
  };

  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 md:mb-16 group/row">
      {/* Title - Same size as other sections */}
      <div className="flex items-center gap-3 mb-6 px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          {title}
        </h2>
      </div>

      {/* Scrollable Container */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/80 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 md:p-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl hover:scale-110"
            aria-label="Scroll left"
          >
            <FiChevronLeft size={28} className="text-white" />
          </button>
        )}

        {/* Movies Grid */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide px-4 md:px-8 py-2 scroll-smooth"
        >
          {movies.slice(0, 10).map((movie, index) => (
            <TiltedMovieCard
              key={movie.id}
              movie={movie}
              rank={index + 1}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/80 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 md:p-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl hover:scale-110"
            aria-label="Scroll right"
          >
            <FiChevronRight size={28} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

interface TiltedMovieCardProps {
  movie: Movie;
  rank: number;
}

const TiltedMovieCard = ({ movie, rank }: TiltedMovieCardProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const [shouldFetchDetails, setShouldFetchDetails] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
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

  // Xác định card nghiêng trái hay phải (lẻ = phải, chẵn = trái)
  const isOddRank = rank % 2 === 1;

  const handleMouseEnter = () => {
    // Set timeout to show popup after 500ms
    hoverTimeoutRef.current = setTimeout(() => {
      setShouldFetchDetails(true);
      setShowPopup(true);
    }, 500);
  };

  const handleMouseLeave = () => {
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

  // Clip-path nghiêng phải (cho cards lẻ: 1, 3, 5, 7, 9)
  const clipPathRight = 'polygon(94.239% 100%, 5.761% 100%, 5.761% 100%, 4.826% 99.95%, 3.94% 99.803%, 3.113% 99.569%, 2.358% 99.256%, 1.687% 98.87%, 1.111% 98.421%, .643% 97.915%, .294% 97.362%, .075% 96.768%, 0 96.142%, 0 3.858%, 0 3.858%, .087% 3.185%, .338% 2.552%, .737% 1.968%, 1.269% 1.442%, 1.92% .984%, 2.672% .602%, 3.512% .306%, 4.423% .105%, 5.391% .008%, 6.4% .024%, 94.879% 6.625%, 94.879% 6.625%, 95.731% 6.732%, 96.532% 6.919%, 97.272% 7.178%, 97.942% 7.503%, 98.533% 7.887%, 99.038% 8.323%, 99.445% 8.805%, 99.747% 9.326%, 99.935% 9.88%, 100% 10.459%, 100% 96.142%, 100% 96.142%, 99.925% 96.768%, 99.706% 97.362%, 99.357% 97.915%, 98.889% 98.421%, 98.313% 98.87%, 97.642% 99.256%, 96.887% 99.569%, 96.06% 99.803%, 95.174% 99.95%, 94.239% 100%)';
  
  // Clip-path nghiêng trái (mirror cho cards chẵn: 2, 4, 6, 8, 10)
  const clipPathLeft = 'polygon(5.761% 100%, 94.239% 100%, 94.239% 100%, 95.174% 99.95%, 96.06% 99.803%, 96.887% 99.569%, 97.642% 99.256%, 98.313% 98.87%, 98.889% 98.421%, 99.357% 97.915%, 99.706% 97.362%, 99.925% 96.768%, 100% 96.142%, 100% 3.858%, 100% 3.858%, 99.913% 3.185%, 99.662% 2.552%, 99.263% 1.968%, 98.731% 1.442%, 98.08% .984%, 97.328% .602%, 96.488% .306%, 95.577% .105%, 94.609% .008%, 93.6% .024%, 5.121% 6.625%, 5.121% 6.625%, 4.269% 6.732%, 3.468% 6.919%, 2.728% 7.178%, 2.058% 7.503%, 1.467% 7.887%, 0.962% 8.323%, 0.555% 8.805%, 0.253% 9.326%, 0.065% 9.88%, 0% 10.459%, 0% 96.142%, 0% 96.142%, 0.075% 96.768%, 0.294% 97.362%, 0.643% 97.915%, 1.111% 98.421%, 1.687% 98.87%, 2.358% 99.256%, 3.113% 99.569%, 3.94% 99.803%, 4.826% 99.95%, 5.761% 100%)';

  return (
    <div
      ref={cardRef}
      className={`flex-none w-[240px] md:w-[280px] lg:w-[320px] transition-all duration-300 ${showPopup ? 'z-40' : 'z-0'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Show popup with fixed positioning */}
      {showPopup && (
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
          className="relative group/card cursor-pointer"
          whileHover={{ 
            scale: 1.05,
            y: -8,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
        {/* Card with Clip-Path - Alternate direction */}
        <div 
          className="relative aspect-[2/3] overflow-hidden bg-gray-900 shadow-2xl"
          style={{
            clipPath: isOddRank ? clipPathRight : clipPathLeft,
            WebkitClipPath: isOddRank ? clipPathRight : clipPathLeft,
          }}
        >
            {/* Poster Image */}
            <img
              src={getImageUrl(movie.poster_path, 'poster', 'medium')}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
              loading="lazy"
            />

            {/* Gradient Overlay - Subtle, bottom only */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Movie Info - Below Card */}
        <div className="mt-3">
          {/* Ranking Number - Large and prominent */}
          <div className="flex items-start gap-3 mb-2">
            <span 
              className="text-5xl md:text-6xl font-black leading-none flex-shrink-0"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.2)',
                textShadow: '2px 2px 6px rgba(0, 0, 0, 0.4)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              {rank}
            </span>
            <div className="flex-1 pt-1">
              <h3 className="text-white font-bold text-sm md:text-base line-clamp-2 mb-1">
                {movie.title}
              </h3>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-gray-400 text-xs line-clamp-1 mb-1">
                  {movie.original_title}
                </p>
              )}
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="font-semibold">{formatRating(movie.vote_average)}</span>
                </span>
                <span>•</span>
                {movie.release_date && (
                  <>
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                    <span>•</span>
                  </>
                )}
                <span>Phần 1</span>
                <span>•</span>
                <span>Tập {Math.min(Math.floor(movie.popularity / 100) || 1, 20)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
    </div>
  );
};

export default TopMoviesTiltedSection;

