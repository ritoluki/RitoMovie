import { useMovies } from '@/hooks/useMovies';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useEffect } from 'react';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';

const Home = () => {
  const { useTrending, usePopular, useTopRated, useMoviesByGenre } = useMovies();
  
  const { data: trending, isLoading: trendingLoading } = useTrending('week');
  const { data: popular, isLoading: popularLoading } = usePopular();
  const { data: topRated, isLoading: topRatedLoading } = useTopRated();
  const { data: action } = useMoviesByGenre(28); // Action
  const { data: comedy } = useMoviesByGenre(35); // Comedy
  const { data: horror } = useMoviesByGenre(27); // Horror
  const { data: romance } = useMoviesByGenre(10749); // Romance
  
  const { isAuthenticated } = useAuthStore();
  const { fetchWatchlist, fetchHistory } = useMovieStore();

  // Fetch user data if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
      fetchHistory();
    }
  }, [isAuthenticated, fetchWatchlist, fetchHistory]);

  const isLoading = trendingLoading || popularLoading || topRatedLoading;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      {trending?.results && trending.results.length > 0 && (
        <HeroBanner movies={trending.results.slice(0, 5)} />
      )}

      {/* Movie Rows */}
      <div className="relative -mt-32 md:-mt-40 z-10 space-y-8 pb-16">
        {trending?.results && (
          <MovieRow title="Trending Now" movies={trending.results} />
        )}
        
        {popular?.results && (
          <MovieRow title="Popular Movies" movies={popular.results} />
        )}
        
        {topRated?.results && (
          <MovieRow title="Top Rated" movies={topRated.results} />
        )}
        
        {action?.results && (
          <MovieRow title="Action Movies" movies={action.results} />
        )}
        
        {comedy?.results && (
          <MovieRow title="Comedy Movies" movies={comedy.results} />
        )}
        
        {horror?.results && (
          <MovieRow title="Horror Movies" movies={horror.results} />
        )}
        
        {romance?.results && (
          <MovieRow title="Romance Movies" movies={romance.results} />
        )}
      </div>
    </div>
  );
};

export default Home;

