import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiInfo, FiHeart } from 'react-icons/fi';
import { IoPlay } from 'react-icons/io5';
import { Movie } from '@/types';
import { getImageUrl, truncateText, formatRuntime, getCertificationFromReleaseDates, getGenreNames } from '@/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovies } from '@/hooks/useMovies';
import { useMovieStore } from '@/store/movieStore';
import { useTranslation } from 'react-i18next';

interface HeroBannerProps {
  movies: Movie[];
}

const HeroBanner = ({ movies }: HeroBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { useMovieDetails, useReleaseDates, useGenres } = useMovies();
  const { addToWatchlist, removeFromWatchlist, watchlist } = useMovieStore();
  const { t } = useTranslation();

  const currentMovie = movies[currentIndex];

  // Fetch detailed info for current movie
  const { data: movieDetails } = useMovieDetails(currentMovie?.id);
  const { data: releaseDates } = useReleaseDates(currentMovie?.id);
  const { data: genresData } = useGenres();

  useEffect(() => {
    if (movies.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movies || movies.length === 0) {
    return null;
  }

  // Get certification
  const certification = releaseDates ? getCertificationFromReleaseDates(releaseDates.results) : null;

  // Get genre names
  const genreNames = genresData ? getGenreNames(currentMovie.genre_ids, genresData.genres) : [];

  // Check if in watchlist (with null/undefined safety check)
  const isInWatchlist = watchlist && Array.isArray(watchlist) ? watchlist.includes(currentMovie.id) : false;

  const handleToggleWatchlist = () => {
    if (isInWatchlist) {
      removeFromWatchlist(currentMovie.id);
    } else {
      addToWatchlist(currentMovie.id);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
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
              className="w-full h-full object-cover object-top"
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
            {/* Bottom fade with blur to suggest more content below */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent backdrop-blur-[2px] pointer-events-none" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-end pt-24 sm:pt-32 md:pt-28 lg:pt-32 pl-6 md:pl-16 lg:pl-24 xl:pl-32 pr-4 pb-40 md:pb-40 lg:pb-44">
            <div className="max-w-3xl space-y-3 md:space-y-5">
              {/* Tagline/Original Title */}
              {currentMovie.original_title && currentMovie.original_title !== currentMovie.title && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-red-500 text-xs md:text-sm font-semibold uppercase tracking-wider text-shadow"
                >
                  {currentMovie.original_title}
                </motion.p>
              )}

              {/* Movie Title */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-shadow-lg leading-tight"
              >
                {currentMovie.title}
              </motion.h1>

              {/* Metadata Badges */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center flex-wrap gap-3"
              >
                {/* IMDb Rating Badge */}
                <div className="flex items-center space-x-1.5 bg-red-500/20 backdrop-blur-sm border border-red-500/40 px-3 py-1.5 rounded">
                  <span className="text-red-400 text-sm font-bold">IMDb</span>
                  <span className="text-white font-semibold text-sm">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                </div>

                {/* Age Rating */}
                {certification && (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded">
                    <span className="text-white font-semibold text-sm">{certification}</span>
                  </div>
                )}

                {/* Year */}
                {currentMovie.release_date && (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded">
                    <span className="text-white font-semibold text-sm">
                      {new Date(currentMovie.release_date).getFullYear()}
                    </span>
                  </div>
                )}

                {/* Duration */}
                {movieDetails?.runtime && (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded">
                    <span className="text-white font-semibold text-sm">
                      {formatRuntime(movieDetails.runtime)}
                    </span>
                  </div>
                )}

                {/* Quality Badge (CAM example) */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded">
                  <span className="text-white font-semibold text-sm">CAM</span>
                </div>
              </motion.div>

              {/* Genre Tags */}
              {genreNames.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center flex-wrap gap-2"
                >
                  {genreNames.map((genre) => (
                    <span
                      key={genre}
                      className="text-white text-[10px] md:text-xs font-medium px-2 py-1 bg-gray-800/50 backdrop-blur-sm rounded text-shadow"
                    >
                      {genre}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* Overview */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-200 text-xs md:text-sm lg:text-base leading-relaxed text-shadow max-w-2xl"
              >
                {truncateText(currentMovie.overview, 250)}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3 md:gap-4 pt-2"
              >
                <Link
                  to={`/watch/${currentMovie.id}`}
                  className="inline-flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold px-4 md:px-8 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <IoPlay size={20} />
                  <span className="hidden md:inline">{t('movie.play')}</span>
                </Link>

                <button
                  onClick={handleToggleWatchlist}
                  className={`inline-flex items-center justify-center space-x-2 font-semibold px-4 md:px-8 py-3 rounded-full backdrop-blur-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${isInWatchlist
                    ? 'bg-red-500/80 hover:bg-red-500 text-white border-2 border-red-400'
                    : 'bg-gray-800/80 hover:bg-gray-700/80 text-white border-2 border-gray-600'
                    }`}
                >
                  <FiHeart size={20} className={isInWatchlist ? 'fill-current' : ''} />
                  <span className="hidden md:inline">{isInWatchlist ? t('movie.inList') : t('movie.myList')}</span>
                </button>

                <Link
                  to={`/movie/${currentMovie.id}`}
                  className="inline-flex items-center justify-center space-x-2 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold px-4 md:px-8 py-3 rounded-full backdrop-blur-sm border-2 border-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FiInfo size={20} />
                  <span className="hidden md:inline">{t('movie.moreInfo')}</span>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Thumbnail Navigation */}
          <div className="absolute bottom-48 right-8 hidden md:flex space-x-2 z-20">
            {movies.slice(0, 5).map((movie, index) => (
              <button
                key={movie.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative overflow-hidden rounded transition-all duration-300 ${index === currentIndex
                  ? 'ring-4 ring-red-500 scale-110'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
              >
                <img
                  src={getImageUrl(movie.poster_path, 'poster', 'small')}
                  alt={movie.title}
                  className="w-16 h-24 object-cover"
                />
              </button>
            ))}
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HeroBanner;

