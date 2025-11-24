import { useMovies } from '@/hooks/useMovies';
import { usePhim } from '@/hooks/usePhim';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';
import PhimRow from '@/components/movie/PhimRow';
import TopMoviesSection from '@/components/movie/TopMoviesSection';
import TopMoviesTiltedSection from '@/components/movie/TopMoviesTiltedSection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ScrollIndicator from '@/components/common/ScrollIndicator';
import SectionDivider from '@/components/common/SectionDivider';
import SkeletonMovieRow from '@/components/common/SkeletonMovieRow';
import { useLazyLoadSection } from '@/hooks/useLazyLoadSection';
import { useEffect } from 'react';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const {
    useTrending,
    usePopular,
    useTopRated,
    useMoviesByGenre,
  } = useMovies();

  const { useCatalogList, useGenreDetail } = usePhim();
  const { t } = useTranslation();

  /**
   * LAZY LOADING STRATEGY - 3 Priority Levels:
   * 
   * PRIORITY 1 - CRITICAL (Load immediately - 2 API calls):
   * - Trending movies (for Hero + TopMoviesSection)
   * - Popular movies (for MovieRow)
   * 
   * PRIORITY 2 - DELAYED (Load after 500ms - 2 API calls):
   * - Top Rated movies
   * - Action movies
   * 
   * PRIORITY 3 - LAZY (Load on scroll - 9 API calls):
   * - Comedy, Horror, Romance movies
   * - Phim Bộ, Anime, Action TV, TV Shows, Comedy TV
   */

  // PRIORITY 1: CRITICAL - Load immediately
  const { data: trending, isLoading: trendingLoading } = useTrending('week');
  const { data: popular, isLoading: popularLoading } = usePopular();

  // PRIORITY 2: DELAYED - Load after 500ms
  const topRatedLazy = useLazyLoadSection({ loadImmediately: true, delay: 500 });
  const actionLazy = useLazyLoadSection({ loadImmediately: true, delay: 500 });

  const { data: topRated, isLoading: topRatedLoading } = useTopRated(
    1,
    { enabled: topRatedLazy.shouldLoad }
  );
  const { data: actionMovies, isLoading: actionLoading } = useMoviesByGenre(
    28,
    1,
    { enabled: actionLazy.shouldLoad }
  );

  // PRIORITY 3: LAZY - Load on scroll (300px before viewport)
  const comedyLazy = useLazyLoadSection({ rootMargin: '300px' });
  const horrorLazy = useLazyLoadSection({ rootMargin: '300px' });
  const romanceLazy = useLazyLoadSection({ rootMargin: '300px' });
  const phimBoLazy = useLazyLoadSection({ rootMargin: '300px' });
  const animeLazy = useLazyLoadSection({ rootMargin: '300px' });
  const actionTvLazy = useLazyLoadSection({ rootMargin: '300px' });
  const tvShowsLazy = useLazyLoadSection({ rootMargin: '300px' });
  const comedyTvLazy = useLazyLoadSection({ rootMargin: '300px' });

  const { data: comedyMovies, isLoading: comedyLoading } = useMoviesByGenre(
    35,
    1,
    { enabled: comedyLazy.shouldLoad }
  );
  const { data: horrorMovies, isLoading: horrorLoading } = useMoviesByGenre(
    27,
    1,
    { enabled: horrorLazy.shouldLoad }
  );
  const { data: romanceMovies, isLoading: romanceLoading } = useMoviesByGenre(
    10749,
    1,
    { enabled: romanceLazy.shouldLoad }
  );

  const { data: phimBo, isLoading: phimBoLoading } = useCatalogList(
    'phim-bo',
    { page: 1, limit: 20 },
    { enabled: phimBoLazy.shouldLoad }
  );
  const { data: anime, isLoading: animeLoading } = useCatalogList(
    'hoat-hinh',
    { page: 1, limit: 20 },
    { enabled: animeLazy.shouldLoad }
  );
  const { data: actionTv, isLoading: actionTvLoading } = useGenreDetail(
    'hanh-dong',
    { page: 1, limit: 20 },
    { enabled: actionTvLazy.shouldLoad }
  );
  const { data: tvShows, isLoading: tvShowsLoading } = useCatalogList(
    'tv-shows',
    { page: 1, limit: 20 },
    { enabled: tvShowsLazy.shouldLoad }
  );
  const { data: comedyTv, isLoading: comedyTvLoading } = useGenreDetail(
    'hai-huoc',
    { page: 1, limit: 20 },
    { enabled: comedyTvLazy.shouldLoad }
  );

  const { isAuthenticated } = useAuthStore();
  const { fetchWatchlist, fetchHistory } = useMovieStore();

  // Fetch user data if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist().catch((error) => {
        console.error('Failed to fetch watchlist:', error);
      });
      fetchHistory().catch((error) => {
        console.error('Failed to fetch history:', error);
      });
    }
  }, [isAuthenticated, fetchWatchlist, fetchHistory]);

  const isLoading = trendingLoading || popularLoading;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen -mt-16 md:-mt-20">
      {/* Hero Banner */}
      {trending?.results && trending.results.length > 0 && (
        <HeroBanner movies={trending.results.slice(0, 5)} />
      )}

      {/* Scroll Indicator - Chỉ hiển thị trên mobile và tablet */}
      <ScrollIndicator className="md:hidden" autoHideDelay={10000} />

      {/* Movie Rows */}
      <div className="relative mt-8 md:mt-12 lg:mt-16 z-10 space-y-8 pb-16">
        {/* ========== PRIORITY 1: CRITICAL ========== */}
        {/* Top 10 TV Series - Uses trending data */}
        {trending?.results && (
          <TopMoviesSection title={t('home.topTVSeries')} movies={trending.results} />
        )}

        {/* Popular Movies */}
        {popular?.results && (
          <MovieRow
            title={t('home.popularMovies')}
            movies={popular.results}
            link="/browse?sort_by=popularity.desc"
          />
        )}

        {/* ========== PRIORITY 2: DELAYED (500ms) ========== */}
        {/* Top Rated Movies */}
        <section ref={topRatedLazy.sectionRef}>
          {!topRatedLazy.shouldLoad || topRatedLoading ? (
            <SkeletonMovieRow />
          ) : topRated?.results ? (
            <MovieRow
              title={t('home.topRated')}
              movies={topRated.results}
              link="/browse?sort_by=vote_average.desc"
            />
          ) : null}
        </section>

        {/* Action Movies */}
        <section ref={actionLazy.sectionRef}>
          {!actionLazy.shouldLoad || actionLoading ? (
            <SkeletonMovieRow />
          ) : actionMovies?.results ? (
            <MovieRow
              title={t('home.actionMovies')}
              movies={actionMovies.results}
              link="/browse?genre=28"
            />
          ) : null}
        </section>

        {/* Top 10 Phim Lẻ - Reuses popular data (no additional API call) */}
        {popular?.results && (
          <TopMoviesTiltedSection title={t('home.topMovies')} movies={popular.results} />
        )}

        {/* Visual divider to indicate more content below */}
        <SectionDivider
          isLoading={!comedyLazy.hasLoaded}
          loadingText="Chuẩn bị thêm nhiều phim hay"
        />

        {/* ========== PRIORITY 3: LAZY (Load on scroll) ========== */}
        {/* Comedy Movies */}
        <section ref={comedyLazy.sectionRef}>
          {!comedyLazy.shouldLoad || comedyLoading ? (
            <SkeletonMovieRow />
          ) : comedyMovies?.results ? (
            <MovieRow
              title={t('home.comedyMovies')}
              movies={comedyMovies.results}
              link="/browse?genre=35"
            />
          ) : null}
        </section>

        {/* Horror Movies */}
        <section ref={horrorLazy.sectionRef}>
          {!horrorLazy.shouldLoad || horrorLoading ? (
            <SkeletonMovieRow />
          ) : horrorMovies?.results ? (
            <MovieRow
              title={t('home.horrorMovies')}
              movies={horrorMovies.results}
              link="/browse?genre=27"
            />
          ) : null}
        </section>

        {/* Romance Movies */}
        <section ref={romanceLazy.sectionRef}>
          {!romanceLazy.shouldLoad || romanceLoading ? (
            <SkeletonMovieRow />
          ) : romanceMovies?.results ? (
            <MovieRow
              title={t('home.romanceMovies')}
              movies={romanceMovies.results}
              link="/browse?genre=10749"
            />
          ) : null}
        </section>

        {/* Phim Bộ (TV Series) */}
        <section ref={phimBoLazy.sectionRef}>
          {!phimBoLazy.shouldLoad || phimBoLoading ? (
            <SkeletonMovieRow />
          ) : phimBo?.items ? (
            <PhimRow title={t('home.popularTvShows')} items={phimBo.items} />
          ) : null}
        </section>

        {/* Anime */}
        <section ref={animeLazy.sectionRef}>
          {!animeLazy.shouldLoad || animeLoading ? (
            <SkeletonMovieRow />
          ) : anime?.items ? (
            <PhimRow title={t('home.animeTvShows')} items={anime.items} />
          ) : null}
        </section>

        {/* Action TV Shows */}
        <section ref={actionTvLazy.sectionRef}>
          {!actionTvLazy.shouldLoad || actionTvLoading ? (
            <SkeletonMovieRow />
          ) : actionTv?.items ? (
            <PhimRow title={t('home.actionTvShows')} items={actionTv.items} />
          ) : null}
        </section>

        {/* TV Shows */}
        <section ref={tvShowsLazy.sectionRef}>
          {!tvShowsLazy.shouldLoad || tvShowsLoading ? (
            <SkeletonMovieRow />
          ) : tvShows?.items ? (
            <PhimRow title={t('home.tvShowsCategory')} items={tvShows.items} />
          ) : null}
        </section>

        {/* Comedy TV Shows */}
        <section ref={comedyTvLazy.sectionRef}>
          {!comedyTvLazy.shouldLoad || comedyTvLoading ? (
            <SkeletonMovieRow />
          ) : comedyTv?.items ? (
            <PhimRow title={t('home.comedyTvShows')} items={comedyTv.items} />
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default Home;

