import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';
import Comments from '../Comments';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { PhimEpisodeServer, PhimMovieSummary } from '@/types';

interface EpisodesTabProps {
  movieId: number;
  movieTitle: string;
  streamingServers?: PhimEpisodeServer[];
  isStreamingLoading?: boolean;
  mediaType?: 'movie' | 'tv';
  slug?: string;
  seasonOptions?: PhimMovieSummary[];
  selectedSeasonSlug?: string;
  onSeasonChange?: (slug: string) => void;
  isSeasonLoading?: boolean;
}

const EpisodesTab = ({
  movieId,
  movieTitle,
  streamingServers,
  isStreamingLoading,
  mediaType = 'movie',
  slug,
  seasonOptions,
  selectedSeasonSlug,
  onSeasonChange,
  isSeasonLoading,
}: EpisodesTabProps) => {
  const { t } = useTranslation();
  const [activeServerIndex, setActiveServerIndex] = useState(0);

  useEffect(() => {
    setActiveServerIndex(0);
  }, [streamingServers]);

  const currentServer = useMemo(() => {
    if (!streamingServers || streamingServers.length === 0) return undefined;
    return streamingServers[activeServerIndex] || streamingServers[0];
  }, [streamingServers, activeServerIndex]);

  if (isStreamingLoading) {
    return <LoadingSpinner />;
  }

  const isSingleEpisodeMovie = mediaType === 'movie' && (currentServer?.server_data.length === 1);

  const showSeasonSelector = Boolean(seasonOptions && seasonOptions.length > 1);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-md p-4">
        {showSeasonSelector && (
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm uppercase tracking-wide text-gray-400">{t('movie.selectSeason')}</span>
              {isSeasonLoading && (
                <span className="text-xs text-gray-400">{t('common.loading')}</span>
              )}
            </div>
            <div className="relative">
              <select
                aria-label={t('movie.selectSeason')}
                className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-800/70 px-4 py-2.5 pr-10 text-sm text-white transition focus:border-red-500 focus:outline-none focus:ring-0 disabled:opacity-70"
                disabled={isSeasonLoading}
                value={selectedSeasonSlug ?? ''}
                onChange={(event) => onSeasonChange?.(event.target.value)}
              >
                {seasonOptions?.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.name} {option.year ? `• ${option.year}` : ''}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm uppercase tracking-wide text-gray-400">{t('movie.selectServer')}</span>
          {streamingServers?.map((server, index) => (
            <button
              key={server.server_name}
              type="button"
              onClick={() => setActiveServerIndex(index)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${index === activeServerIndex
                ? 'border-red-500 bg-red-600/20 text-red-200'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-red-500/60'
                }`}
            >
              {server.server_name}
            </button>
          ))}
        </div>

        {currentServer ? (
          <div>
            {!isSingleEpisodeMovie && (
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-white font-semibold">
                  {t('movie.chooseEpisode')} • {movieTitle}
                </h4>
                <span className="text-xs text-gray-400">
                  {currentServer.server_data.length} {t('movie.episodes').toLowerCase()}
                </span>
              </div>
            )}

            <div
              className={isSingleEpisodeMovie
                ? 'flex flex-wrap items-center gap-3'
                : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3'}
            >
              {currentServer.server_data.map((episode) => {
                const params = new URLSearchParams();
                params.set('type', mediaType);
                if (slug) {
                  params.set('slug', slug);
                }
                params.set('server', activeServerIndex.toString());
                params.set('episode', episode.slug);
                const href = `/watch/${movieId}?${params.toString()}`;
                return (
                  <Link
                    key={`${currentServer.server_name}-${episode.slug}`}
                    to={href}
                    className={`group rounded-xl border border-gray-800 bg-gray-800/60 px-6 py-3 text-center text-sm font-semibold text-gray-200 transition hover:border-red-500 hover:bg-red-600/30 ${isSingleEpisodeMovie ? 'min-w-[120px]' : ''}`}
                  >
                    <span>{episode.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/40 p-6 text-center">
            <p className="text-gray-400 text-sm">{t('movie.noStreamingData')}</p>
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-gray-800" data-comments-section>
        <Comments movieId={movieId} />
      </div>
    </div>
  );
};

export default EpisodesTab;

