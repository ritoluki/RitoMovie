import { useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Movie } from '@/types';
import MovieCard from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
}

const MovieRow = ({ title, movies }: MovieRowProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-gray-900 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          aria-label="Scroll left"
        >
          <FiChevronLeft size={32} className="text-white drop-shadow-lg" />
        </button>

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

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-gray-900 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          aria-label="Scroll right"
        >
          <FiChevronRight size={32} className="text-white drop-shadow-lg" />
        </button>
      </div>
    </div>
  );
};

export default MovieRow;

