import { useRef, useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Movie } from '@/types';
import MovieCard from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
}

const MovieRow = ({ title, movies }: MovieRowProps) => {
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
      return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
    }
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
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
    <div className="mb-8 md:mb-12 group/row">
      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 px-4 md:px-8">
        {title}
      </h2>

      {/* Scrollable Container */}
      <div className="relative">
        {/* Left Arrow - Only show when not at start */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 md:p-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl hover:scale-110"
            aria-label="Scroll left"
          >
            <FiChevronLeft size={28} className="text-white" />
          </button>
        )}

        {/* Movies */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide px-4 md:px-8 py-2"
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="flex-none w-36 md:w-48 lg:w-52"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {/* Right Arrow - Always show when there's more content */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 md:p-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl hover:scale-110"
            aria-label="Scroll right"
          >
            <FiChevronRight size={28} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MovieRow;

