import { useMovies } from '@/hooks/useMovies';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';
import LazyMovieRow from '@/components/movie/LazyMovieRow';
import LazyPhimRow from '@/components/movie/LazyPhimRow';
import TopMoviesSection from '@/components/movie/TopMoviesSection';
import TopMoviesTiltedSection from '@/components/movie/TopMoviesTiltedSection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ScrollIndicator from '@/components/common/ScrollIndicator';
import LazyLoadSection from '@/components/common/LazyLoadSection';
import { useEffect } from 'react';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const {
    useTrending,
    usePopular,
  } = useMovies();
  const { t } = useTranslation();

  // Chỉ load hero banner và 2 sections đầu tiên ngay lập tức
  const { data: trending, isLoading: trendingLoading } = useTrending('week');
  const { data: popular, isLoading: popularLoading } = usePopular();

  // Các sections khác sẽ được lazy load khi user scroll đến
  // Không gọi API ở đây nữa để giảm load ban đầu

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
        {/* Top 10 Section - Load ngay lập tức */}
        {trending?.results && (
          <TopMoviesSection
            title={t('home.topTVSeries')}
            movies={trending.results}
          />
        )}

        {/* Popular Movies - Load ngay lập tức */}
        {popular?.results && (
          <MovieRow
            title={t('home.popularMovies')}
            movies={popular.results}
            link="/browse?sort_by=popularity.desc"
          />
        )}

        {/* Top Rated - Lazy Load */}
        <LazyMovieRow
          title={t('home.topRated')}
          type="topRated"
          link="/browse?sort_by=vote_average.desc"
          sectionId="topRated"
        />

        {/* Action Movies - Lazy Load */}
        <LazyMovieRow
          title={t('home.actionMovies')}
          type="genre"
          genreId={28}
          link="/browse?genre=28"
          sectionId="action"
          previousSectionId="topRated"
        />

        {/* Top 10 Phim Lẻ với Tilted Style - Lazy Load */}
        {popular?.results && (
          <LazyLoadSection rootMargin="0px" threshold={0.5}>
            <TopMoviesTiltedSection
              title={t('home.topMovies')}
              movies={popular.results}
            />
          </LazyLoadSection>
        )}

        {/* Comedy Movies - Lazy Load */}
        <LazyMovieRow
          title={t('home.comedyMovies')}
          type="genre"
          genreId={35}
          link="/browse?genre=35"
          sectionId="comedy"
          previousSectionId="action"
        />

        {/* Horror Movies - Lazy Load */}
        <LazyMovieRow
          title={t('home.horrorMovies')}
          type="genre"
          genreId={27}
          link="/browse?genre=27"
          sectionId="horror"
          previousSectionId="comedy"
        />

        {/* Romance Movies - Lazy Load */}
        <LazyMovieRow
          title={t('home.romanceMovies')}
          type="genre"
          genreId={10749}
          link="/browse?genre=10749"
          sectionId="romance"
          previousSectionId="horror"
        />

        {/* TV Series Sections - Tất cả đều Lazy Load */}
        <LazyPhimRow
          title={t('home.popularTvShows')}
          catalogType="phim-bo"
          params={{
            limit: 20,
            page: 1,
            sort_field: 'modified.time',
            sort_type: 'desc'
          }}
          sectionId="phimBo"
          previousSectionId="romance"
        />

        <LazyPhimRow
          title={t('home.animeTvShows')}
          catalogType="hoat-hinh"
          params={{ limit: 20, page: 1 }}
          sectionId="anime"
          previousSectionId="phimBo"
        />

        <LazyPhimRow
          title={t('home.actionTvShows')}
          genreSlug="hanh-dong"
          params={{ limit: 20, page: 1 }}
          sectionId="actionTv"
          previousSectionId="anime"
        />

        <LazyPhimRow
          title={t('home.tvShowsCategory')}
          catalogType="tv-shows"
          params={{ limit: 20, page: 1 }}
          sectionId="tvShows"
          previousSectionId="actionTv"
        />

        <LazyPhimRow
          title={t('home.comedyTvShows')}
          genreSlug="hai-huoc"
          params={{ limit: 20, page: 1 }}
          sectionId="comedyTv"
          previousSectionId="tvShows"
        />
      </div>
    </div>
  );
};

export default Home;

