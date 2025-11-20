import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiInfo } from 'react-icons/fi';
import { Movie } from '@/types';
import { getImageUrl, truncateText } from '@/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroBannerProps {
  movies: Movie[];
}

const HeroBanner = ({ movies }: HeroBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (movies.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movies || movies.length === 0) {
    return null;
  }

  const currentMovie = movies[currentIndex];

  return (
    <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={getImageUrl(currentMovie.backdrop_path, 'backdrop', 'original')}
              alt={currentMovie.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full container mx-auto px-4 flex items-center">
            <div className="max-w-2xl space-y-4 md:space-y-6">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-shadow-lg"
              >
                {currentMovie.title}
              </motion.h1>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400 text-xl">★</span>
                  <span className="text-white font-semibold">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                </div>
                {currentMovie.release_date && (
                  <span className="text-gray-300">
                    {new Date(currentMovie.release_date).getFullYear()}
                  </span>
                )}
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-200 text-base md:text-lg leading-relaxed text-shadow"
              >
                {truncateText(currentMovie.overview, 200)}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  to={`/watch/${currentMovie.id}`}
                  className="inline-flex items-center space-x-2 bg-white hover:bg-gray-200 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
                >
                  <FiPlay size={20} />
                  <span>Play</span>
                </Link>
                
                <Link
                  to={`/movie/${currentMovie.id}`}
                  className="inline-flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold px-8 py-3 rounded-lg backdrop-blur-sm transition-colors duration-200"
                >
                  <FiInfo size={20} />
                  <span>More Info</span>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {movies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HeroBanner;

