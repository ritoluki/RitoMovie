import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiPlus, FiCheck, FiInfo } from 'react-icons/fi';
import { IoPlay } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { PhimMovieSummary, MovieDetails } from '@/types';
import { getPhimImageUrl, truncateText, formatRating, formatRuntime } from '@/utils/helpers';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';

interface PhimPopupProps {
  item: PhimMovieSummary;
  tmdbMovie?: MovieDetails;
  isLoading: boolean;
  isVisible: boolean;
  onClose: () => void;
  cardRef: React.RefObject<HTMLDivElement>;
}

const getTmdbNumericId = (item: PhimMovieSummary): number | null => {
  if (!item.tmdb?.id) return null;
  const parsed = Number(item.tmdb.id);
  return Number.isFinite(parsed) ? parsed : null;
};

const getTmdbMediaType = (item: PhimMovieSummary): 'movie' | 'tv' => {
  return item.tmdb?.type === 'tv' ? 'tv' : 'movie';
};

const PhimPopup = ({ item, tmdbMovie, isLoading, isVisible, onClose, cardRef }: PhimPopupProps) => {
  const { t } = useTranslation();
  const tmdbId = getTmdbNumericId(item);
  const mediaType = getTmdbMediaType(item);
  const slug = item.slug || item._id || '';
  const slugPath = encodeURIComponent(slug);

  const buildWatchHref = () => {
    if (tmdbId) {
      const params = new URLSearchParams();
      params.set('type', mediaType);
      if (slug) {
        params.set('slug', slug);
      }
      return `/watch/${tmdbId}?${params.toString()}`;
    }

    const params = new URLSearchParams();
    params.set('type', mediaType);
    const query = params.toString();
    return query ? `/watch/${slugPath}?${query}` : `/watch/${slugPath}`;
  };

  const watchHref = buildWatchHref();
  const detailHref = tmdbId ? `/movie/${tmdbId}?type=${mediaType}` : watchHref;
  const qualityLabel = item.quality || item.lang;
  const langLabel = item.lang;
  const episodeLabel = item.episode_current || item.time;

  const { isAuthenticated } = useAuthStore();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useMovieStore();
  const inWatchlist = tmdbId ? isInWatchlist(tmdbId) : false;

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    if (isVisible && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const popupWidth = 380;
      const popupHeight = 420;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const overlap = 40;

      let top = cardRect.top;
      let left = cardRect.left;

      if (cardRect.right + popupWidth - overlap <= viewportWidth) {
        left = cardRect.right - overlap;
      } else if (cardRect.left - popupWidth + overlap >= 0) {
        left = cardRect.left - popupWidth + overlap;
      } else {
        left = Math.min(cardRect.left, viewportWidth - popupWidth - 20);
        left = Math.max(20, left);
      }

      if (top + popupHeight > viewportHeight) {
        top = Math.max(20, viewportHeight - popupHeight - 20);
      }
      top = Math.max(20, top);

      setPosition({ top, left });
      setIsPositioned(true);
    }
  }, [isVisible, cardRef]);

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tmdbId || !isAuthenticated) return;

    try {
      if (inWatchlist) {
        await removeFromWatchlist(tmdbId);
      } else {
        await addToWatchlist(tmdbId);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const backdropImage = getPhimImageUrl(item.poster_url || item.thumb_url);
  const rating = tmdbMovie?.vote_average ?? item.tmdb?.vote_average;
  const runtime = tmdbMovie?.runtime ?? tmdbMovie?.episode_run_time?.[0];
  const overview = tmdbMovie?.overview || item.origin_name || truncateText(item.name, 90);

  return (
    <AnimatePresence>
      {isVisible && isPositioned && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.2 } }}
          className="fixed z-[9999] w-[380px] max-w-[85vw] bg-gray-900 rounded-xl shadow-2xl backdrop-blur-xl border-2 border-white/20"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            boxShadow: '0 25px 70px -12px rgba(0, 0, 0, 0.9), 0 10px 25px -5px rgba(0, 0, 0, 0.7)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-56 overflow-hidden rounded-t-xl">
            <img
              src={backdropImage}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

            <div className="absolute top-3 left-3 flex items-center gap-2">
              {qualityLabel && (
                <span className="px-2.5 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-bold rounded border border-white/30">
                  {qualityLabel}
                </span>
              )}
              {rating && (
                <span className="px-2.5 py-1 bg-yellow-500/90 backdrop-blur-sm text-gray-900 text-xs font-bold rounded">
                  IMDb {formatRating(rating)}
                </span>
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
              <Link
                to={watchHref}
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 flex-1 bg-white hover:bg-gray-200 text-gray-900 font-bold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg"
              >
                <IoPlay size={18} />
                <span className="text-sm">{t('movie.watchNow')}</span>
              </Link>

              {tmdbId && isAuthenticated && (
                <button
                  onClick={handleWatchlistClick}
                  className="p-2.5 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 shadow-lg"
                  aria-label={inWatchlist ? t('movie.removeFromList') : t('movie.addToList')}
                >
                  {inWatchlist ? <FiCheck size={20} /> : <FiPlus size={20} />}
                </button>
              )}

              <Link
                to={detailHref}
                onClick={handleLinkClick}
                className="p-2.5 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 shadow-lg"
                aria-label={t('movie.moreInfo')}
              >
                <FiInfo size={20} />
              </Link>
            </div>
          </div>

          <div className="p-5 space-y-3 rounded-b-xl overflow-hidden">
            <div>
              <h3 className="text-white font-bold text-lg line-clamp-2 leading-tight">{item.name}</h3>
              {item.origin_name && item.origin_name !== item.name && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-1">{item.origin_name}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-300">
              {item.year && (
                <>
                  <span className="font-semibold text-green-400">{item.year}</span>
                  <span className="text-gray-500">•</span>
                </>
              )}

              {runtime && (
                <>
                  <span>{formatRuntime(runtime)}</span>
                  <span className="text-gray-500">•</span>
                </>
              )}

              {item.quality && (
                <>
                  <span className="px-2 py-0.5 bg-red-600/90 text-white text-xs font-bold rounded">
                    {item.quality}
                  </span>
                  <span className="text-gray-500">•</span>
                </>
              )}

              {item.lang && (
                <>
                  <span className="px-2 py-0.5 bg-gray-700/50 text-white text-xs font-medium rounded border border-gray-600/50">
                    {item.lang}
                  </span>
                  {episodeLabel && <span className="text-gray-500">•</span>}
                </>
              )}

              {episodeLabel && (
                <span className="text-gray-400 text-xs">
                  {episodeLabel}
                </span>
              )}
            </div>

            {item.category && item.category.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.category.slice(0, 3).map((category) => (
                  <span
                    key={category.id || category._id || category.slug}
                    className="px-2 py-0.5 bg-gray-800/80 text-gray-300 text-xs font-medium rounded border border-gray-700/50"
                  >
                    {category.name}
                  </span>
                ))}
                {item.category.length > 3 && (
                  <span className="px-2 py-0.5 text-gray-400 text-xs font-medium">
                    +{item.category.length - 3}
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="flex gap-1.5">
                <div className="h-5 w-16 bg-gray-800 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-800 rounded animate-pulse" />
                <div className="h-5 w-14 bg-gray-800 rounded animate-pulse" />
              </div>
            ) : (
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">{overview}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhimPopup;
