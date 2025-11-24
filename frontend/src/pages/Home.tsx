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
import { useHomeData } from '@/hooks/useHomeData';
import { useEffect } from 'react';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();

  /**
   * OPTIMIZED STRATEGY - Single Batch API Call
   * 
   * Instead of 13+ individual API calls, we now fetch all data in a single batch request.
   * This dramatically improves performance:
   * - Initial load: 1 request instead of 13+
   * - Faster page load time
   * - Reduced server load
   * - Better caching strategy
   * 
   * Lazy loading is still used for rendering sections progressively
   */
  const { data: homeData, isLoading, error } = useHomeData();

  // Lazy loading sections for progressive rendering
  const topRatedLazy = useLazyLoadSection({ loadImmediately: true, delay: 100 });
  const actionLazy = useLazyLoadSection({ loadImmediately: true, delay: 200 });
  const comedyLazy = useLazyLoadSection({ rootMargin: '300px' });
  const horrorLazy = useLazyLoadSection({ rootMargin: '300px' });
  const romanceLazy = useLazyLoadSection({ rootMargin: '300px' });
  const phimBoLazy = useLazyLoadSection({ rootMargin: '300px' });
  const animeLazy = useLazyLoadSection({ rootMargin: '300px' });
  const actionTvLazy = useLazyLoadSection({ rootMargin: '300px' });
  const tvShowsLazy = useLazyLoadSection({ rootMargin: '300px' });
  const comedyTvLazy = useLazyLoadSection({ rootMargin: '300px' });

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

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    console.error('Failed to load home data:', error);
  }

  // Handle case when data is not yet loaded or failed
  if (!homeData) {
    return <LoadingSpinner fullScreen />;
  }

  // Extract data from batch response - data is directly in homeData, not homeData.data!
  const trending = homeData.trending;
  const popular = homeData.popular;
  const topRated = homeData.topRated;
  const actionMovies = homeData.genres?.action;
  const comedyMovies = homeData.genres?.comedy;
  const horrorMovies = homeData.genres?.horror;
  const romanceMovies = homeData.genres?.romance;
  const phimBo = homeData.phim?.phimBo;
  const anime = homeData.phim?.anime;
  const tvShows = homeData.phim?.tvShows;
  const actionTv = homeData.phimGenres?.action;
  const comedyTv = homeData.phimGenres?.comedy;

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

        {/* ========== PRIORITY 2: DELAYED (Progressive Rendering) ========== */}
        {/* Top Rated Movies */}
        <section ref={topRatedLazy.sectionRef}>
          {!topRatedLazy.shouldLoad ? (
            <SkeletonMovieRow />
          ) : topRated?.results && topRated.results.length > 0 ? (
            <MovieRow
              title={t('home.topRated')}
              movies={topRated.results}
              link="/browse?sort_by=vote_average.desc"
            />
          ) : null}
        </section>

        {/* Action Movies */}
        <section ref={actionLazy.sectionRef}>
          {!actionLazy.shouldLoad ? (
            <SkeletonMovieRow />
          ) : actionMovies?.results && actionMovies.results.length > 0 ? (
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
          {!comedyLazy.shouldLoad ? (
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
          {!horrorLazy.shouldLoad ? (
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
          {!romanceLazy.shouldLoad ? (
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
          {!phimBoLazy.shouldLoad ? (
            <SkeletonMovieRow />
          ) : phimBo?.items ? (
            <PhimRow title={t('home.popularTvShows')} items={phimBo.items} />
          ) : null}
        </section>

        {/* Anime */}
        <section ref={animeLazy.sectionRef}>
          {!animeLazy.shouldLoad ? (
            <SkeletonMovieRow />
          ) : anime?.items ? (
            <PhimRow title={t('home.animeTvShows')} items={anime.items} />
          ) : null}
        </section>

        {/* Action TV Shows */}
        <section ref={actionTvLazy.sectionRef}>
          {!actionTvLazy.shouldLoad ? (
            <SkeletonMovieRow />
          ) : actionTv?.items ? (
            <PhimRow title={t('home.actionTvShows')} items={actionTv.items} />
          ) : null}
        </section>

        {/* TV Shows */}
        <section ref={tvShowsLazy.sectionRef}>
          {!tvShowsLazy.shouldLoad ? (
            <SkeletonMovieRow />
          ) : tvShows?.items ? (
            <PhimRow title={t('home.tvShowsCategory')} items={tvShows.items} />
          ) : null}
        </section>

        {/* Comedy TV Shows */}
        <section ref={comedyTvLazy.sectionRef}>
          {!comedyTvLazy.shouldLoad ? (
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