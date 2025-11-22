import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovies } from '@/hooks/useMovies';
import { movieService } from '@/services/movieService';
import { Movie, Genre } from '@/types';
import MovieCard from '@/components/movie/MovieCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FiFilter } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface CertificationOption {
  code: string;
  name: string;
  description: string;
  tmdbCertification: string;
}

const CERTIFICATION_COUNTRY = 'US';

const CERTIFICATION_OPTIONS: CertificationOption[] = [
  { code: 'P', name: 'P', description: 'Mọi lứa tuổi', tmdbCertification: 'G' },
  { code: 'K', name: 'K', description: 'Dưới 13 tuổi', tmdbCertification: 'PG' },
  { code: 'T13', name: 'T13', description: '13 tuổi trở lên', tmdbCertification: 'PG-13' },
  { code: 'T16', name: 'T16', description: '16 tuổi trở lên', tmdbCertification: 'R' },
  { code: 'T18', name: 'T18', description: '18 tuổi trở lên', tmdbCertification: 'NC-17' },
];

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Read initial values from URL params
  const searchQuery = searchParams.get('q') || '';
  const genreParam = searchParams.get('genre') || '';
  const countryParam = searchParams.get('country') || '';
  const sortParam = searchParams.get('sort_by') || 'popularity.desc';
  const yearParam = searchParams.get('year') || '';
  const ratingParam = searchParams.get('rating') || '';

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<string>(genreParam);
  const [selectedCountry, setSelectedCountry] = useState<string>(countryParam);
  const [selectedYear, setSelectedYear] = useState<string>(yearParam);
  const [selectedRating, setSelectedRating] = useState<string>(ratingParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const { useGenres } = useMovies();
  const { data: genresData } = useGenres();

  const genres: Genre[] = genresData?.genres || [];

  // Countries list (same as Header)
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'KR', name: 'South Korea' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TH', name: 'Thailand' },
    { code: 'IN', name: 'India' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'MX', name: 'Mexico' },
    { code: 'BR', name: 'Brazil' },
    { code: 'VN', name: 'Vietnam' },
  ];

  // Sync state with URL params when they change
  useEffect(() => {
    const genreParam = searchParams.get('genre') || '';
    const countryParam = searchParams.get('country') || '';
    const sortParam = searchParams.get('sort_by') || 'popularity.desc';
    const yearParam = searchParams.get('year') || '';
    const ratingParam = searchParams.get('rating') || '';
    setSelectedGenre(genreParam);
    setSelectedCountry(countryParam);
    setSortBy(sortParam);
    setSelectedYear(yearParam);
    setSelectedRating(ratingParam);
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
            with_origin_country: selectedCountry || undefined,
            year: selectedYear ? parseInt(selectedYear) : undefined,
            certification_country: selectedCertification ? CERTIFICATION_COUNTRY : undefined,
            certification: selectedCertification?.tmdbCertification,
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
  }, [searchQuery, page, sortBy, selectedGenre, selectedCountry, selectedYear, selectedRating]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, selectedGenre, selectedCountry, selectedYear, selectedRating]);

  const applyFilters = () => {
    const params: any = {};
    if (selectedGenre) params.genre = selectedGenre;
    if (selectedCountry) params.country = selectedCountry;
    if (selectedYear) params.year = selectedYear;
    if (selectedRating) params.rating = selectedRating;
    if (sortBy !== 'popularity.desc') params.sort_by = sortBy;
    setSearchParams(params);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedCountry('');
    setSelectedYear('');
    setSelectedRating('');
    setSortBy('popularity.desc');
    setSearchParams({});
    setShowFilterModal(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const selectedCertification = selectedRating
    ? CERTIFICATION_OPTIONS.find((cert) => cert.code === selectedRating)
    : undefined;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {searchQuery ? `Kết quả tìm kiếm "${searchQuery}"` : 'Phim nổi bật'}
              </h1>
              <p className="text-gray-400">
                {searchQuery
                  ? `Tìm thấy ${movies.length} kết quả`
                  : 'Khám phá bộ phim yêu thích tiếp theo của bạn'
                }
              </p>
            </div>

            {/* Mobile Filter Icon */}
            {!searchQuery && (
              <button
                onClick={() => setShowFilterModal(true)}
                className="sm:hidden inline-flex items-center justify-center rounded-full bg-gray-800 text-white p-2 hover:bg-gray-700 transition-colors"
                aria-label="Bộ lọc"
              >
                <FiFilter size={18} />
              </button>
            )}
          </div>

          {/* Filter Button */}
          {!searchQuery && (
            <button
              onClick={() => setShowFilterModal(true)}
              className="hidden sm:inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
            >
              <FiFilter size={20} />
              <span>Bộ lọc</span>
            </button>
          )}
        </div>

        {/* Movies Grid */}
        <div>
          {isLoading ? (
            <LoadingSpinner />
          ) : movies.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
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
                    Trước
                  </button>

                  <span className="text-white px-4">
                    Trang {page} / {Math.min(totalPages, 500)}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || page >= 500}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Không tìm thấy phim nào</p>
              {(searchQuery || selectedGenre || selectedYear || selectedCountry || selectedRating) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-primary-600 hover:text-primary-500 font-medium"
                >
                  Xóa bộ lọc và thử lại
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterModal(false)}
              className="fixed inset-0 bg-black/70 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-gray-900 z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Phim nổi bật</h2>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Filters */}
                <div className="space-y-6">
                  {/* Quốc gia */}
                  <div>
                    <h3 className="text-white font-medium mb-3">Quốc gia:</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCountry('')}
                        className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedCountry === ''
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                        Tất cả
                      </button>
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => setSelectedCountry(country.code)}
                          className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedCountry === country.code
                            ? 'bg-yellow-500 text-black font-medium'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                          {country.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thể loại */}
                  <div>
                    <h3 className="text-white font-medium mb-3">Thể loại:</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedGenre('')}
                        className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedGenre === ''
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                        Tất cả
                      </button>
                      {genres.map((genre) => (
                        <button
                          key={genre.id}
                          onClick={() => setSelectedGenre(genre.id.toString())}
                          className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedGenre === genre.id.toString()
                            ? 'bg-yellow-500 text-black font-medium'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Năm sản xuất */}
                  <div>
                    <h3 className="text-white font-medium mb-3">Năm sản xuất:</h3>
                    <div className="grid grid-cols-5 gap-2">
                      <button
                        onClick={() => setSelectedYear('')}
                        className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedYear === ''
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                        Tất cả
                      </button>
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year.toString())}
                          className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedYear === year.toString()
                            ? 'bg-yellow-500 text-black font-medium'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Xếp hạng */}
                  <div>
                    <h3 className="text-white font-medium mb-3">Xếp hạng:</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedRating('')}
                        className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedRating === ''
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                        Tất cả
                      </button>
                      {CERTIFICATION_OPTIONS.map((cert) => (
                        <button
                          key={cert.code}
                          onClick={() => setSelectedRating(cert.code)}
                          className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedRating === cert.code
                            ? 'bg-yellow-500 text-black font-medium'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                          title={cert.description}
                        >
                          <span className="font-bold">{cert.name}</span>
                          <span className="ml-1.5 text-xs opacity-80">({cert.description})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sắp xếp */}
                  <div>
                    <h3 className="text-white font-medium mb-3">Sắp xếp:</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSortBy('popularity.desc')}
                        className={`px-4 py-2 rounded-md text-sm transition-colors ${sortBy === 'popularity.desc'
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                        Mới nhất
                      </button>
                      <button
                        onClick={() => setSortBy('vote_average.desc')}
                        className={`px-4 py-2 rounded-md text-sm transition-colors ${sortBy === 'vote_average.desc'
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                        Phổ biến nhất
                      </button>
                      <button
                        onClick={() => setSortBy('release_date.desc')}
                        className={`px-4 py-2 rounded-md text-sm transition-colors ${sortBy === 'release_date.desc'
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                        Năm phát hành
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Lọc kết quả
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Browse;