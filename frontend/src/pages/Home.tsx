import { useMovies } from '@/hooks/useMovies';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';
import PhimRow from '@/components/movie/PhimRow';
import TopMoviesSection from '@/components/movie/TopMoviesSection';
import TopMoviesTiltedSection from '@/components/movie/TopMoviesTiltedSection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ScrollIndicator from '@/components/common/ScrollIndicator';
import { useEffect } from 'react';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { usePhim } from '@/hooks/usePhim';

const Home = () => {
  const { useTrending, usePopular, useTopRated, useMoviesByGenre } = useMovies();
  const { useCatalogList } = usePhim();
  const { t } = useTranslation();

  const { data: trending, isLoading: trendingLoading } = useTrending('week');
  const { data: popular, isLoading: popularLoading } = usePopular();
  const { data: topRated, isLoading: topRatedLoading } = useTopRated();
  const { data: action } = useMoviesByGenre(28); // Action
  const { data: comedy } = useMoviesByGenre(35); // Comedy
  const { data: horror } = useMoviesByGenre(27); // Horror
  const { data: romance } = useMoviesByGenre(10749); // Romance
  const { data: featuredSeries } = useCatalogList('phim-bo', { limit: 12, page: 1 });

  const { isAuthenticated } = useAuthStore();
  const { fetchWatchlist, fetchHistory } = useMovieStore();

  // Fetch user data if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Add error handling to prevent crashes if fetch fails
      fetchWatchlist().catch((error) => {
        console.error('Failed to fetch watchlist:', error);
        // Error is handled in movieStore, but we catch here to prevent unhandled promise rejection
      });
      fetchHistory().catch((error) => {
        console.error('Failed to fetch history:', error);
        // Error is handled in movieStore, but we catch here to prevent unhandled promise rejection
      });
    }
  }, [isAuthenticated, fetchWatchlist, fetchHistory]);

  const isLoading = trendingLoading || popularLoading || topRatedLoading;

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
        {/* Top 10 Section with Beautiful Design */}
        {trending?.results && (
          <TopMoviesSection
            title={t('home.topTVSeries')}
            movies={trending.results}
          />
        )}

        {trending?.results && (
          <MovieRow
            title={t('home.trendingNow')}
            movies={trending.results}
            link="/browse?sort_by=popularity.desc"
          />
        )}

        {popular?.results && (
          <MovieRow
            title={t('home.popularMovies')}
            movies={popular.results}
            link="/browse?sort_by=popularity.desc"
          />
        )}

        {topRated?.results && (
          <MovieRow
            title={t('home.topRated')}
            movies={topRated.results}
            link="/browse?sort_by=vote_average.desc"
          />
        )}

        {action?.results && (
          <MovieRow
            title={t('home.actionMovies')}
            movies={action.results}
            link="/browse?genre=28"
          />
        )}

        {/* Top 10 Phim Lẻ with Tilted Style - Ở giữa các section */}
        {topRated?.results && (
          <TopMoviesTiltedSection
            title={t('home.topMovies')}
            movies={topRated.results}
          />
        )}

        {comedy?.results && (
          <MovieRow
            title={t('home.comedyMovies')}
            movies={comedy.results}
            link="/browse?genre=35"
          />
        )}

        {horror?.results && (
          <MovieRow
            title={t('home.horrorMovies')}
            movies={horror.results}
            link="/browse?genre=27"
          />
        )}

        {romance?.results && (
          <MovieRow
            title={t('home.romanceMovies')}
            movies={romance.results}
            link="/browse?genre=10749"
          />
        )}

        {featuredSeries?.data?.items && (
          <PhimRow
            title={t('home.seriesFromPhim')}
            items={featuredSeries.data.items}
          />
        )}
      </div>
    </div>
  );
};

export default Home;

