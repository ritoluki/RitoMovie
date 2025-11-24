import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiInfo, FiList } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useMovies } from '@/hooks/useMovies';
import { usePhim } from '@/hooks/usePhim';
import VideoPlayer from '@/components/movie/VideoPlayer';
import Comments from '@/components/movie/Comments';
import { getImageUrl, getPhimImageUrl } from '@/utils/helpers';

const Watch = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const mediaTypeParam = searchParams.get('type');
  const mediaType: 'movie' | 'tv' = mediaTypeParam === 'tv' ? 'tv' : 'movie';

  const rawId = id || '';
  const parsedId = Number(rawId);
  const hasNumericId = Number.isFinite(parsedId) && parsedId > 0;
  const movieId = hasNumericId ? parsedId : 0;
  const slugFromQuery = searchParams.get('slug') || undefined;
  const slugFromPath = !hasNumericId && rawId ? rawId : undefined;
  const resolvedSlug = slugFromPath || slugFromQuery;

  const episodesSectionRef = useRef<HTMLDivElement | null>(null);

  const { useMovieDetails } = useMovies();
  const { useMovieByTmdb, useMovieBySlug } = usePhim();

  const {
    data: movie,
    isLoading: movieLoading,
  } = useMovieDetails(movieId, { mediaType });

  const tmdbType = mediaType === 'tv' ? 'tv' : 'movie';
  const {
    data: streamingByTmdb,
    isLoading: streamingByTmdbLoading,
    isError: streamingByTmdbError,
  } = useMovieByTmdb(hasNumericId ? movieId : undefined, tmdbType);

  const {
    data: streamingBySlug,
    isLoading: streamingBySlugLoading,
    isError: streamingBySlugError,
  } = useMovieBySlug(!hasNumericId ? resolvedSlug : undefined);

  const streamingData = streamingByTmdb ?? streamingBySlug;
  const streamingLoading = streamingByTmdbLoading || (!streamingByTmdb && streamingBySlugLoading);
  const streamingError = streamingByTmdbError && !streamingBySlug ? streamingByTmdbError : streamingBySlugError;

  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [selectedEpisodeSlug, setSelectedEpisodeSlug] = useState<string | null>(null);

  const currentServer = streamingData?.episodes?.[activeServerIndex];
  const currentEpisode = useMemo(() => {
    if (!currentServer) return undefined;
    return (
      currentServer.server_data.find((episode) => episode.slug === selectedEpisodeSlug) ||
      currentServer.server_data[0]
    );
  }, [currentServer, selectedEpisodeSlug]);

  const currentEpisodeIndex = currentServer?.server_data.findIndex((episode) => episode.slug === currentEpisode?.slug) ?? -1;
  const nextEpisode = currentEpisodeIndex >= 0 ? currentServer?.server_data[currentEpisodeIndex + 1] : undefined;

  useEffect(() => {
    if (!streamingData?.episodes?.length) return;

    const serverParam = Number(searchParams.get('server'));
    const episodeParam = searchParams.get('episode');

    const normalizedServer =
      Number.isFinite(serverParam) && streamingData.episodes[serverParam]
        ? serverParam
        : 0;

    const fallbackEpisode = streamingData.episodes[normalizedServer]?.server_data[0]?.slug || null;
    const hasEpisode = episodeParam
      ? streamingData.episodes[normalizedServer]?.server_data.some((ep) => ep.slug === episodeParam)
      : false;

    setActiveServerIndex(normalizedServer);
    setSelectedEpisodeSlug(hasEpisode ? episodeParam : fallbackEpisode);
  }, [streamingData, searchParams]);

  const updateQueryParams = (server: number, episode?: string | null, slug?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', mediaType);
    params.set('server', server.toString());
    if (episode) {
      params.set('episode', episode);
    } else {
      params.delete('episode');
    }

    const slugValue = slug || slugFromQuery || slugFromPath;
    if (slugValue) {
      params.set('slug', slugValue);
    }

    setSearchParams(params);
  };

  const handleServerChange = (index: number) => {
    if (index === activeServerIndex) return;
    const firstEpisode = streamingData?.episodes?.[index]?.server_data[0];
    setActiveServerIndex(index);
    const nextEpisodeSlug = firstEpisode?.slug || null;
    setSelectedEpisodeSlug(nextEpisodeSlug);
    updateQueryParams(index, nextEpisodeSlug, streamingData?.movie?.slug);
  };

  const handleEpisodeChange = (slug: string) => {
    if (slug === selectedEpisodeSlug) return;
    setSelectedEpisodeSlug(slug);
    updateQueryParams(activeServerIndex, slug, streamingData?.movie?.slug);
  };

  const hasStreams = Boolean(streamingData?.episodes?.length && currentEpisode);

  if (streamingLoading || (!streamingData && movieLoading)) {
    return <LoadingSpinner fullScreen />;
  }

  const streamingMeta = streamingData?.movie;
  const displayTitle = movie?.title || movie?.name || streamingMeta?.name || streamingMeta?.origin_name || t('movie.watchNow');
  const ratingValue = movie?.vote_average ?? streamingMeta?.tmdb?.vote_average;
  const releaseSource = movie?.release_date || movie?.first_air_date;
  const releaseYear = releaseSource
    ? new Date(releaseSource).getFullYear()
    : streamingMeta?.year;
  const runtimeMinutes = movie?.runtime ?? movie?.episode_run_time?.[0];
  const runtimeLabel = runtimeMinutes
    ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
    : streamingMeta?.time;
  const overviewText = movie?.overview || streamingMeta?.content || t('movie.noOverview');
  const genresToShow = movie?.genres?.map((genre) => ({ id: genre.id, label: genre.name }))
    || streamingMeta?.category?.map((cat) => ({ id: cat.id || cat.slug, label: cat.name }));
  const posterImage = streamingMeta?.thumb_url
    ? getPhimImageUrl(streamingMeta.thumb_url)
    : streamingMeta?.poster_url
      ? getPhimImageUrl(streamingMeta.poster_url)
      : getImageUrl(movie?.backdrop_path || null, 'backdrop');
  const portraitPoster = streamingMeta?.poster_url
    ? getPhimImageUrl(streamingMeta.poster_url)
    : movie?.poster_path
      ? getImageUrl(movie.poster_path, 'poster')
      : posterImage;
  const infoBadges = [
    streamingMeta?.type ? streamingMeta.type : null,
    streamingMeta?.episode_current ? `${t('movie.episode')} ${streamingMeta.episode_current}` : null,
    streamingMeta?.episode_total && streamingMeta?.episode_total !== streamingMeta?.episode_current
      ? `${streamingMeta.episode_total} ${t('movie.episodes')}`
      : null,
    releaseYear?.toString(),
    runtimeLabel,
    streamingMeta?.quality,
    streamingMeta?.lang_name || streamingMeta?.lang,
  ].filter(Boolean) as string[];
  const detailFacts = [
    { label: t('movie.rating'), value: ratingValue ? ratingValue.toFixed(1) : null },
    { label: t('movie.runtime'), value: runtimeLabel },
    {
      label: t('movie.releaseDate'),
      value: releaseYear ? releaseYear.toString() : streamingMeta?.year?.toString(),
    },
    {
      label: t('movie.country'),
      value: streamingMeta?.country?.map((country) => country.name).join(', '),
    },
  ].filter((item) => item.value);
  const actorList = streamingMeta?.actor?.filter(Boolean).slice(0, 5) ?? [];
  const commentMovieId = hasNumericId
    ? movieId
    : Number(streamingMeta?.tmdb?.id) || (movie?.id ?? 0);
  const canShowComments = commentMovieId > 0;
  const detailPageLink = movie ? `/movie/${movie.id}?type=${mediaType}` : undefined;

  const handleNextEpisode = () => {
    if (!nextEpisode) return;
    handleEpisodeChange(nextEpisode.slug);
  };

  const handleScrollToEpisodes = () => {
    episodesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasMultipleEpisodes = Boolean(streamingData?.episodes?.some((server) => server.server_data.length > 1));
  const isSeries = mediaType === 'tv' || hasMultipleEpisodes || (streamingMeta?.type && streamingMeta.type !== 'single');
  const shouldShowEpisodeHeading = isSeries;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
      {/* Nút back - trên desktop ở trên, mobile ở dưới video */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden md:block absolute top-24 left-4 md:left-8 z-30"
      >
        <Link
          to={detailPageLink || '/'}
          className="inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-sm hover:bg-black/70 transition"
        >
          <FiArrowLeft size={20} />
          <span className="text-sm font-semibold line-clamp-1 max-w-[220px]">{displayTitle}</span>
        </Link>
      </motion.div>

      <div className="container mx-auto px-0 md:pt-16">
        {/* Video container - không có border radius trên mobile */}
        <div className="aspect-video relative overflow-hidden md:rounded-3xl bg-gray-900 shadow-2xl">
          {isSeries && (
            <div className="video-overlay-info absolute top-0 left-0 right-0 flex justify-between p-4 md:p-6 pointer-events-none z-40 transition-opacity duration-300">
              <div className="pointer-events-none">
                <p className="text-lg md:text-2xl font-semibold text-white drop-shadow-lg">{displayTitle}</p>
                {currentEpisode?.name && (
                  <span className="text-white/80 text-sm md:text-base">{currentEpisode.name}</span>
                )}
              </div>
              <div className="pointer-events-auto">
                <button
                  type="button"
                  onClick={handleScrollToEpisodes}
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/25 transition"
                >
                  <FiList size={18} />
                  <span>{t('watch.toggleEpisodes')}</span>
                </button>
              </div>
            </div>
          )}
          <VideoPlayer
            hlsSource={currentEpisode?.link_m3u8}
            embedSource={currentEpisode?.link_embed}
            poster={posterImage}
            title={`${displayTitle} • ${currentEpisode?.name || ''}`}
            onNextEpisode={nextEpisode ? handleNextEpisode : undefined}
            nextEpisodeLabel={nextEpisode?.name}
            onEpisodeListToggle={isSeries ? handleScrollToEpisodes : undefined}
            showEpisodeListButton={isSeries}
            episodeListLabel={t('watch.toggleEpisodes')}
          />
        </div>

        {/* Nút back trên mobile - xuống dưới video */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="md:hidden px-4 py-4"
        >
          <Link
            to={detailPageLink || '/'}
            className="inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-sm hover:bg-black/70 transition"
          >
            <FiArrowLeft size={20} />
            <span className="text-sm font-semibold line-clamp-1 max-w-[220px]">{displayTitle}</span>
          </Link>
        </motion.div>

        <div className="container mx-auto px-4 md:px-8 py-10 hidden md:block">
          <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
            <div className="rounded-3xl border border-gray-800 bg-gray-900 bg-opacity-80 p-6 shadow-xl">
              <div className="overflow-hidden rounded-2xl border border-gray-800 border-opacity-80 bg-gray-800">
                <img src={portraitPoster} alt={displayTitle} className="w-full h-full object-cover" loading="lazy" />
              </div>
              {infoBadges.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {infoBadges.map((badge, index) => (
                    <span
                      key={`${badge}-${index}`}
                      className="rounded-full bg-white bg-opacity-10 px-3 py-1 text-xs uppercase tracking-wide text-white"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
              {detailPageLink && (
                <Link
                  to={detailPageLink}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white bg-opacity-90 py-2 text-sm font-semibold text-gray-900 transition hover:bg-white"
                >
                  {t('movie.moreInfo')}
                </Link>
              )}
            </div>

            <div className="rounded-3xl border border-gray-800 bg-gray-900 bg-opacity-60 p-6 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-widest text-white text-opacity-60">{streamingMeta?.origin_name}</p>
                  <h1 className="text-3xl font-bold text-white">{displayTitle}</h1>
                </div>
                {typeof ratingValue === 'number' && (
                  <div className="rounded-2xl border border-yellow-500 border-opacity-50 bg-yellow-500 bg-opacity-10 px-4 py-2 text-center">
                    <p className="text-xs uppercase tracking-widest text-yellow-400">IMDb / TMDB</p>
                    <p className="text-2xl font-semibold text-yellow-300">{ratingValue.toFixed(1)}</p>
                  </div>
                )}
              </div>

              <p className="mt-4 text-base text-gray-300 leading-relaxed">{overviewText}</p>

              {detailFacts.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {detailFacts.map((fact) => (
                    <div key={fact.label} className="rounded-2xl border border-gray-800 border-opacity-70 bg-gray-900 bg-opacity-40 px-4 py-3">
                      <p className="text-xs uppercase tracking-widest text-white text-opacity-50">{fact.label}</p>
                      <p className="text-base font-semibold text-white">{fact.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {genresToShow && genresToShow.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs uppercase tracking-widest text-white text-opacity-50">{t('movie.genres')}</p>
                  <div className="flex flex-wrap gap-2">
                    {genresToShow.map((genre) => (
                      <span key={genre.id} className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-200">
                        {genre.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {actorList.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs uppercase tracking-widest text-white text-opacity-50">{t('movie.cast')}</p>
                  <div className="flex flex-wrap gap-3">
                    {actorList.map((actor) => (
                      <span key={actor} className="rounded-xl bg-white bg-opacity-5 px-3 py-1 text-sm text-white text-opacity-90">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasStreams && currentServer && (
          <div ref={episodesSectionRef} className="container mx-auto px-4 md:px-8 py-6" id="episode-list">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-md p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  {t('movie.selectServer')}
                </span>
                {streamingData?.episodes?.map((server, index) => (
                  <button
                    key={server.server_name}
                    type="button"
                    onClick={() => handleServerChange(index)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${index === activeServerIndex
                      ? 'border-red-500 bg-red-600/20 text-red-200'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-red-500/60'
                      }`}
                  >
                    {server.server_name}
                  </button>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold">
                    {t('movie.chooseEpisode')} • {displayTitle}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {currentServer.server_data.length} {t('movie.episodes').toLowerCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {currentServer.server_data.map((episode) => {
                    const isActive = episode.slug === currentEpisode?.slug;
                    return (
                      <button
                        key={`${currentServer.server_name}-${episode.slug}`}
                        type="button"
                        onClick={() => handleEpisodeChange(episode.slug)}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${isActive
                          ? 'border-red-500 bg-red-600/30 text-red-100 shadow-lg shadow-red-900/30'
                          : 'border-gray-800 bg-gray-800/60 text-gray-200 hover:border-red-500/60'
                          }`}
                      >
                        {episode.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        {canShowComments && (
          <div className="container mx-auto px-4 md:px-8 pb-16">
            <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 shadow-2xl">
              <Comments movieId={commentMovieId} />
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default Watch;

