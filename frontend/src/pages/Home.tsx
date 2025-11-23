import { useMovies } from '@/hooks/useMovies';
import { usePhim } from '@/hooks/usePhim';
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

const Home = () => {
  const {
    useTrending,
    usePopular,
    useTopRated,
    useMoviesByGenre,
  } = useMovies();

  const { useCatalogList, useGenreDetail } = usePhim();
  const { t } = useTranslation();

  // Load tất cả data ngay lập tức
  const { data: trending, isLoading: trendingLoading } = useTrending('week');
  const { data: popular, isLoading: popularLoading } = usePopular();
  const { data: topRated } = useTopRated();
  const { data: actionMovies } = useMoviesByGenre(28);
  const { data: comedyMovies } = useMoviesByGenre(35);
  const { data: horrorMovies } = useMoviesByGenre(27);
  const { data: romanceMovies } = useMoviesByGenre(10749);

  // Load Phim data
  const { data: phimBo } = useCatalogList('phim-bo', { page: 1, limit: 20 });
  const { data: anime } = useCatalogList('hoat-hinh', { page: 1, limit: 20 });
  const { data: actionTv } = useGenreDetail('hanh-dong', { page: 1, limit: 20 });
  const { data: tvShows } = useCatalogList('tv-shows', { page: 1, limit: 20 });
  const { data: comedyTv } = useGenreDetail('hai-huoc', { page: 1, limit: 20 });

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
        {/* Top 10 TV Series */}
        {trending?.results && (
          <TopMoviesSection
            title={t('home.topTVSeries')}
            movies={trending.results}
          />
        )}

        {/* Popular Movies */}
        {popular?.results && (
          <MovieRow
            title={t('home.popularMovies')}
            movies={popular.results}
            link="/browse?sort_by=popularity.desc"
          />
        )}

        {/* Top Rated */}
        {topRated?.results && (
          <MovieRow
            title={t('home.topRated')}
            movies={topRated.results}
            link="/browse?sort_by=vote_average.desc"
          />
        )}

        {/* Action Movies */}
        {actionMovies?.results && (
          <MovieRow
            title={t('home.actionMovies')}
            movies={actionMovies.results}
            link="/browse?genre=28"
          />
        )}

        {/* Top 10 Phim Lẻ với Tilted Style */}
        {popular?.results && (
          <TopMoviesTiltedSection
            title={t('home.topMovies')}
            movies={popular.results}
          />
        )}

        {/* Comedy Movies */}
        {comedyMovies?.results && (
          <MovieRow
            title={t('home.comedyMovies')}
            movies={comedyMovies.results}
            link="/browse?genre=35"
          />
        )}

        {/* Horror Movies */}
        {horrorMovies?.results && (
          <MovieRow
            title={t('home.horrorMovies')}
            movies={horrorMovies.results}
            link="/browse?genre=27"
          />
        )}

        {/* Romance Movies */}
        {romanceMovies?.results && (
          <MovieRow
            title={t('home.romanceMovies')}
            movies={romanceMovies.results}
            link="/browse?genre=10749"
          />
        )}

        {/* TV Series Sections */}
        {phimBo?.items && (
          <PhimRow
            title={t('home.popularTvShows')}
            items={phimBo.items}
          />
        )}

        {anime?.items && (
          <PhimRow
            title={t('home.animeTvShows')}
            items={anime.items}
          />
        )}

        {actionTv?.items && (
          <PhimRow
            title={t('home.actionTvShows')}
            items={actionTv.items}
          />
        )}

        {tvShows?.items && (
          <PhimRow
            title={t('home.tvShowsCategory')}
            items={tvShows.items}
          />
        )}

        {comedyTv?.items && (
          <PhimRow
            title={t('home.comedyTvShows')}
            items={comedyTv.items}
          />
        )}
      </div>
    </div>
  );
};

export default Home;

