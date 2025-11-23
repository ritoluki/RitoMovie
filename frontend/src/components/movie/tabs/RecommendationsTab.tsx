import { Movie } from '@/types';
import { Link } from 'react-router-dom';
import { getImageUrl, formatRating } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface RecommendationsTabProps {
  mediaType?: 'movie' | 'tv';
  movies: Movie[];
  isLoading?: boolean;
}

const originalTitle = (movie: Movie) => movie.original_title || movie.original_name || movie.title || movie.name || '';

const releaseYear = (movie: Movie) => {
  const date = movie.release_date || movie.first_air_date;
  return date ? new Date(date).getFullYear() : undefined;
};

const RecommendationsTab = ({ movies, isLoading, mediaType = 'movie' }: RecommendationsTabProps) => {
  const { t } = useTranslation();
  const typeParam = mediaType === 'tv' ? 'tv' : 'movie';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{t('movie.noRecommendations')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">{t('movie.youMightLike')}</h3>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => {
          const title = movie.title || movie.name || '';
          const original = originalTitle(movie);
          const year = releaseYear(movie);
          return (
            <Link
              key={movie.id}
              to={`/movie/${movie.id}?type=${typeParam}`}
              className="group"
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-3">
                  <img
                    src={getImageUrl(movie.poster_path, 'poster', 'medium')}
                    alt={movie.title || movie.name || ''}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Overlay with metadata */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {/* Rating Badge */}
                      {movie.vote_average > 0 && (
                        <div className="inline-flex items-center gap-1 bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-bold mb-2">
                          <span>⭐</span>
                          <span>{formatRating(movie.vote_average)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Episode badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="inline-flex items-center px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                      {t('movie.part')} 8
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                      TM. 6
                    </span>
                  </div>

                  {/* Season/Episode indicator */}
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-bold rounded">
                      {t('movie.part')} {Math.min(Math.floor(movie.popularity / 100) || 4, 10)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h4 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-yellow-400 transition-colors">
                    {title}
                  </h4>
                  {original && original !== title && (
                    <p className="text-gray-400 text-xs line-clamp-1">
                      {original}
                    </p>
                  )}
                  {year && (
                    <p className="text-gray-500 text-xs">
                      {year}
                    </p>
                  )}
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsTab;

