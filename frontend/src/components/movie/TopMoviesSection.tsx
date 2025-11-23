import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Movie } from '@/types';
import { getImageUrl, formatRating, getCertificationFromReleaseDates } from '@/utils/helpers';
import { useMovies } from '@/hooks/useMovies';
import { usePhim } from '@/hooks/usePhim';
import MoviePopup from './MoviePopup';

interface TopMoviesSectionProps {
  title: string;
  movies: Movie[];
}

const TopMoviesSection = ({ title, movies }: TopMoviesSectionProps) => {
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
      {/* Title */}
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
            <TopMovieCard
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

interface TopMovieCardProps {
  movie: Movie;
  rank: number;
}

const TopMovieCard = ({ movie, rank }: TopMovieCardProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const [shouldFetchDetails, setShouldFetchDetails] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { useMovieDetails } = useMovies();
  const { useMovieByTmdb } = usePhim();

  // Fetch details - React Query will cache the results
  const { data: movieDetails, isLoading: detailsLoading } = useMovieDetails(movie.id);

  // Fetch PhimAPI data to get quality and lang info
  const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
  const { data: phimData } = useMovieByTmdb(movie.id, mediaType);

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

  // Get certification (age restriction) from movie details or fallback
  const getCertification = () => {
    // Try to get from movieDetails first
    if (shouldFetchDetails && movieDetails?.release_dates?.results) {
      const cert = getCertificationFromReleaseDates(movieDetails.release_dates.results);
      if (cert) return cert;
    }

    // Fallback to simplified logic
    if (movie.adult) return 'T18';
    if (movie.vote_average < 6) return 'T13';
    if (movie.vote_average < 7.5) return 'T16';
    return 'T13';
  };

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
      className={`flex-none w-[240px] md:w-[280px] lg:w-[320px] transition-all duration-300 ${showPopup ? 'z-40' : 'z-0'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Show popup with fixed positioning */}
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
          className="relative group/card cursor-pointer"
          whileHover={{ y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Rank Number */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-20">
            <div className="relative">
              <span className="text-[120px] md:text-[140px] lg:text-[160px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/90 via-white/60 to-white/30" style={{
                WebkitTextStroke: '2px rgba(255, 255, 255, 0.2)',
                textShadow: '4px 4px 12px rgba(0, 0, 0, 0.5)',
              }}>
                {rank}
              </span>
            </div>
          </div>

          {/* Movie Card */}
          <div className="relative ml-12 md:ml-14 lg:ml-16">
            {/* Poster Container */}
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
              <img
                src={getImageUrl(movie.poster_path, 'poster', 'medium')}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                loading="lazy"
              />
            </div>

            {/* Movie Title - Below Poster */}
            <div className="mt-3 space-y-1">
              <h3 className="text-white font-bold text-base md:text-lg line-clamp-2 group-hover/card:text-red-500 transition-colors duration-200">
                {movie.title}
              </h3>
              <p className="text-gray-400 text-xs md:text-sm">
                {movie.original_title !== movie.title ? movie.original_title : ''}
              </p>
            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  );
};

export default TopMoviesSection;

