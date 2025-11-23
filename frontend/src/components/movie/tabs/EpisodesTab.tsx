import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Comments from '../Comments';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { PhimEpisodeServer } from '@/types';

interface EpisodesTabProps {
  movieId: number;
  movieTitle: string;
  streamingServers?: PhimEpisodeServer[];
  isStreamingLoading?: boolean;
  mediaType?: 'movie' | 'tv';
  slug?: string;
}

const EpisodesTab = ({ movieId, movieTitle, streamingServers, isStreamingLoading, mediaType = 'movie', slug }: EpisodesTabProps) => {
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-md p-4">
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

