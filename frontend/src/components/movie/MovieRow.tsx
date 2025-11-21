import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Movie } from '@/types';
import MovieCard from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  link?: string;
}

const MovieRow = ({ title, movies, link }: MovieRowProps) => {
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
      {/* Title with See More Button */}
      <div className="flex items-center gap-3 mb-4 px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          {title}
        </h2>

        {link && (
          <Link
            to={link}
            className="group/more flex items-center justify-center gap-0 px-2 py-1 rounded-full group-hover/more:rounded-lg border-2 border-white/30 group-hover/more:border-red-500/50 hover:bg-red-500/10 text-white transition-all duration-300"
          >
            <span className="text-sm font-medium text-red-500 max-w-0 group-hover/more:max-w-[80px] group-hover/more:pl-2 group-hover/more:pr-1 opacity-0 group-hover/more:opacity-100 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden">
              Xem thêm
            </span>
            <FiChevronRight size={16} className="flex-shrink-0" />
          </Link>
        )}
      </div>

      {/* Scrollable Container */}
      <div className="relative">
        {/* Left Arrow - Only show on desktop when not at start */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:block absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 md:p-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl hover:scale-110"
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

        {/* Right Arrow - Only show on desktop when there's more content */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:block absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 md:p-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl hover:scale-110"
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

