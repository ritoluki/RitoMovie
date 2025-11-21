import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovies } from '@/hooks/useMovies';
import { movieService } from '@/services/movieService';
import { Movie, Genre } from '@/types';
import MovieCard from '@/components/movie/MovieCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Dropdown from '@/components/common/Dropdown';
import { FiFilter, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Read initial values from URL params
  const searchQuery = searchParams.get('q') || '';
  const genreParam = searchParams.get('genre') || '';
  const sortParam = searchParams.get('sort_by') || 'popularity.desc';

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<string>(genreParam);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [sortBy, setSortBy] = useState(sortParam);
  const { useGenres, useSearchMovies } = useMovies();
  const { data: genresData } = useGenres();

  const genres: Genre[] = genresData?.genres || [];

  // Sync state with URL params when they change
  useEffect(() => {
    const genreParam = searchParams.get('genre') || '';
    const sortParam = searchParams.get('sort_by') || 'popularity.desc';
    setSelectedGenre(genreParam);
    setSortBy(sortParam);
  }, [searchParams]);

  // Fetch movies based on filters or search
  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true);
      try {
        let data;

        if (searchQuery) {
          // Search mode
          data = await movieService.search(searchQuery, page);
        } else {
          // Browse mode with filters
          data = await movieService.discover({
            page,
            sort_by: sortBy,
            with_genres: selectedGenre,
            year: selectedYear ? parseInt(selectedYear) : undefined,
          });
        }

        setMovies(data.results);
        setTotalPages(data.total_pages);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [searchQuery, page, sortBy, selectedGenre, selectedYear]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, selectedGenre, selectedYear]);

  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    // Clear search when using filters
    if (searchQuery) {
      setSearchParams({});
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (searchQuery) {
      setSearchParams({});
    }
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedYear('');
    setSortBy('popularity.desc');
    setSearchParams({});
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  // Prepare dropdown options
  const sortOptions = [
    { value: 'popularity.desc', label: 'Mới nhất' },
    { value: 'vote_average.desc', label: 'Phổ biến' },
    { value: 'release_date.desc', label: 'Cũ nhất' },
    { value: 'release_date.asc', label: 'Oldest First' },
    { value: 'title.asc', label: 'Title (A-Z)' },
  ];

  const genreOptions = [
    { value: '', label: 'All Genres' },
    ...genres.map((genre) => ({
      value: genre.id.toString(),
      label: genre.name,
    })),
  ];

  const yearOptions = [
    { value: '', label: 'All Years' },
    ...years.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    })),
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Browse Movies'}
            </h1>
            <p className="text-gray-400">
              {searchQuery
                ? `Found ${movies.length} results`
                : 'Discover your next favorite movie'
              }
            </p>
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden mt-4 inline-flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiFilter size={20} />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {(showFilters || window.innerWidth >= 768) && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="md:w-64 flex-none"
              >
                <div className="bg-gray-800 rounded-lg p-6 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                    {(selectedGenre || selectedYear || searchQuery) && (
                      <button
                        onClick={clearFilters}
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Sort */}
                  <Dropdown
                    label="Sort By"
                    value={sortBy}
                    onChange={handleSortChange}
                    options={sortOptions}
                    className="mb-6"
                  />

                  {/* Genre */}
                  {!searchQuery && (
                    <Dropdown
                      label="Genre"
                      value={selectedGenre}
                      onChange={handleGenreChange}
                      options={genreOptions}
                      className="mb-6"
                    />
                  )}

                  {/* Year */}
                  {!searchQuery && (
                    <Dropdown
                      label="Release Year"
                      value={selectedYear}
                      onChange={handleYearChange}
                      options={yearOptions}
                      className="mb-6"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Movies Grid */}
          <div className="flex-1">
            {isLoading ? (
              <LoadingSpinner />
            ) : movies.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {movies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Previous
                    </button>

                    <span className="text-white px-4">
                      Page {page} of {Math.min(totalPages, 500)}
                    </span>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || page >= 500}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No movies found</p>
                {(searchQuery || selectedGenre || selectedYear) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Clear filters and try again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;

