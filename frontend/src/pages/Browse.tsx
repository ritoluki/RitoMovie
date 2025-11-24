import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovies } from '@/hooks/useMovies';
import { usePhim } from '@/hooks/usePhim';
import { movieService } from '@/services/movieService';
import { phimService, CatalogType } from '@/services/phimService';
import { Movie, Genre, PhimMovieSummary, PhimPagination } from '@/types';
import MovieCard from '@/components/movie/MovieCard';
import PhimCard from '@/components/movie/PhimCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/common/Pagination';
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

const PHIM_CATALOG_TYPES: CatalogType[] = [
  'phim-bo',
  'phim-le',
  'tv-shows',
  'hoat-hinh',
  'phim-vietsub',
  'phim-thuyet-minh',
  'phim-long-tieng',
];

const PHIM_PAGE_SIZE = 24;

type PhimSortField = '_id' | 'modified.time' | 'year';
type PhimSortType = 'asc' | 'desc';

const PHIM_SORT_OPTIONS: { value: PhimSortField; label: string }[] = [
  { value: 'modified.time', label: 'Mới cập nhật' },
  { value: 'year', label: 'Năm phát hành' },
  { value: '_id', label: 'Thêm gần đây' },
];

const PHIM_SORT_TYPE_OPTIONS: { value: PhimSortType; label: string }[] = [
  { value: 'desc', label: 'Giảm dần' },
  { value: 'asc', label: 'Tăng dần' },
];

const PHIM_CATALOG_LABELS: Record<CatalogType, string> = {
  'phim-bo': 'Phim bộ',
  'phim-le': 'Phim lẻ',
  'tv-shows': 'TV Shows',
  'hoat-hinh': 'Hoạt hình',
  'phim-vietsub': 'Vietsub',
  'phim-thuyet-minh': 'Thuyết minh',
  'phim-long-tieng': 'Lồng tiếng',
};

const isValidPhimCatalog = (value: string | null): value is CatalogType => {
  if (!value) return false;
  return PHIM_CATALOG_TYPES.includes(value as CatalogType);
};

const isValidPhimSortField = (value: string | null): value is PhimSortField => {
  if (!value) return false;
  return ['_id', 'modified.time', 'year'].includes(value);
};

const isValidPhimSortType = (value: string | null): value is PhimSortType => {
  if (!value) return false;
  return ['asc', 'desc'].includes(value);
};

const getPhimTotalPages = (pagination?: PhimPagination) => {
  if (!pagination) return 1;
  if (pagination.totalPages) return pagination.totalPages;
  if (pagination.totalItems && pagination.totalItemsPerPage) {
    return Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);
  }
  return Math.max(pagination.currentPage || 1, 1);
};

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [phimItems, setPhimItems] = useState<PhimMovieSummary[]>([]);
  const [isPhimMode, setIsPhimMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Read initial values from URL params
  const searchQuery = searchParams.get('q') || '';
  const genreParam = searchParams.get('genre') || '';
  const countryParam = searchParams.get('country') || '';
  const catalogParamRaw = searchParams.get('catalog');
  const catalogFilter = isValidPhimCatalog(catalogParamRaw) ? catalogParamRaw : undefined;
  const phimGenreParam = searchParams.get('phimGenre') || '';
  const phimCountryParam = searchParams.get('phimCountry') || '';
  const phimYearParam = searchParams.get('phimYear') || '';
  const phimSortFieldParam = searchParams.get('phimSortField');
  const phimSortTypeParam = searchParams.get('phimSortType');
  const phimSortField = isValidPhimSortField(phimSortFieldParam) ? phimSortFieldParam : 'modified.time';
  const phimSortType = isValidPhimSortType(phimSortTypeParam) ? phimSortTypeParam : 'desc';
  const sortParam = searchParams.get('sort_by') || 'popularity.desc';
  const yearParam = searchParams.get('year') || '';
  const ratingParam = searchParams.get('rating') || '';
  const isPhimFilterActive =
    !searchQuery && (
      Boolean(catalogFilter) ||
      Boolean(phimGenreParam) ||
      Boolean(phimCountryParam) ||
      Boolean(phimYearParam) ||
      Boolean(phimSortFieldParam) ||
      Boolean(phimSortTypeParam)
    );

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<string>(genreParam);
  const [selectedCountry, setSelectedCountry] = useState<string>(countryParam);
  const [selectedYear, setSelectedYear] = useState<string>(yearParam);
  const [selectedRating, setSelectedRating] = useState<string>(ratingParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [selectedPhimCatalog, setSelectedPhimCatalog] = useState<CatalogType>(catalogFilter ?? 'phim-le');
  const [selectedPhimGenre, setSelectedPhimGenre] = useState<string>(phimGenreParam);
  const [selectedPhimCountry, setSelectedPhimCountry] = useState<string>(phimCountryParam);
  const [selectedPhimYear, setSelectedPhimYear] = useState<string>(phimYearParam);
  const [selectedPhimSortField, setSelectedPhimSortField] = useState<PhimSortField>(phimSortField);
  const [selectedPhimSortType, setSelectedPhimSortType] = useState<PhimSortType>(phimSortType);
  const { useGenres } = useMovies();
  const { data: genresData } = useGenres();
  const { useGenres: usePhimGenres, useCountries: usePhimCountries } = usePhim();
  const { data: phimGenresData } = usePhimGenres();
  const { data: phimCountriesData } = usePhimCountries();

  const genres: Genre[] = genresData?.genres || [];
  const phimGenres = phimGenresData ?? [];
  const phimCountries = phimCountriesData ?? [];

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

    const catalogParam = searchParams.get('catalog');
    setSelectedPhimCatalog(isValidPhimCatalog(catalogParam) ? (catalogParam as CatalogType) : 'phim-le');
    setSelectedPhimGenre(searchParams.get('phimGenre') || '');
    setSelectedPhimCountry(searchParams.get('phimCountry') || '');
    setSelectedPhimYear(searchParams.get('phimYear') || '');

    const phimSortFieldParam = searchParams.get('phimSortField');
    setSelectedPhimSortField(
      isValidPhimSortField(phimSortFieldParam) ? phimSortFieldParam : 'modified.time'
    );

    const phimSortTypeParam = searchParams.get('phimSortType');
    setSelectedPhimSortType(isValidPhimSortType(phimSortTypeParam) ? phimSortTypeParam : 'desc');
  }, [searchParams]);

  // Fetch movies based on filters or search
  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true);
      try {
        if (isPhimFilterActive) {
          setIsPhimMode(true);
          setMovies([]);
          let response;
          const parsedYear = phimYearParam ? Number(phimYearParam) : undefined;
          const yearFilter = parsedYear && Number.isFinite(parsedYear) ? parsedYear : undefined;
          const basePhimParams = {
            page,
            limit: PHIM_PAGE_SIZE,
            sort_field: phimSortField,
            sort_type: phimSortType,
            year: yearFilter,
          } as const;

          if (catalogFilter) {
            response = await phimService.getCatalogList(catalogFilter, {
              ...basePhimParams,
              category: phimGenreParam || undefined,
              country: phimCountryParam || undefined,
            });
          } else if (phimGenreParam) {
            response = await phimService.getGenreDetail(phimGenreParam, {
              ...basePhimParams,
              country: phimCountryParam || undefined,
            });
          } else if (phimCountryParam) {
            response = await phimService.getCountryDetail(phimCountryParam, {
              ...basePhimParams,
              category: phimGenreParam || undefined,
            });
          } else {
            response = await phimService.getCatalogList('phim-le', basePhimParams);
          }

          const payload = response?.data ?? response;

          if (!payload) {
            setPhimItems([]);
            setTotalPages(1);
            return;
          }

          const items = payload.items ?? payload.data?.items ?? [];
          setPhimItems(items.slice(0, PHIM_PAGE_SIZE));
          const pagination = payload.params?.pagination ?? payload.data?.params?.pagination;
          setTotalPages(getPhimTotalPages(pagination));
        } else {
          setIsPhimMode(false);
          setPhimItems([]);
          let data;

          if (searchQuery) {
            data = await movieService.search(searchQuery, page);
          } else {
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
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        if (isPhimFilterActive) {
          setPhimItems([]);
        } else {
          setMovies([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [
    isPhimFilterActive,
    catalogFilter,
    phimGenreParam,
    phimCountryParam,
    phimYearParam,
    phimSortField,
    phimSortType,
    searchQuery,
    page,
    sortBy,
    selectedGenre,
    selectedCountry,
    selectedYear,
    selectedRating,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    sortBy,
    selectedGenre,
    selectedCountry,
    selectedYear,
    selectedRating,
    catalogFilter,
    phimGenreParam,
    phimCountryParam,
    phimYearParam,
    phimSortField,
    phimSortType,
    isPhimFilterActive,
  ]);

  // Handle page change with scroll to top
  const handlePageChange = (newPage: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage(newPage);
  };

  const applyFilters = () => {
    if (isPhimMode) {
      const params: Record<string, string> = {};
      if (selectedPhimCatalog) params.catalog = selectedPhimCatalog;
      if (selectedPhimGenre) params.phimGenre = selectedPhimGenre;
      if (selectedPhimCountry) params.phimCountry = selectedPhimCountry;
      if (selectedPhimYear) params.phimYear = selectedPhimYear;
      if (selectedPhimSortField) params.phimSortField = selectedPhimSortField;
      if (selectedPhimSortType) params.phimSortType = selectedPhimSortType;
      setSearchParams(params);
      setShowFilterModal(false);
      return;
    }

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
    if (isPhimMode) {
      const catalogToReset: CatalogType = catalogFilter ?? 'phim-le';
      setSelectedPhimGenre('');
      setSelectedPhimCountry('');
      setSelectedPhimYear('');
      setSelectedPhimSortField('modified.time');
      setSelectedPhimSortType('desc');
      setSelectedPhimCatalog(catalogToReset);
      setSearchParams({ catalog: catalogToReset });
      setShowFilterModal(false);
      return;
    }

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

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedGenre ||
    selectedCountry ||
    selectedYear ||
    selectedRating ||
    isPhimFilterActive
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {searchQuery
                  ? `Kết quả tìm kiếm "${searchQuery}"`
                  : isPhimFilterActive
                    ? 'Danh sách phim lẻ'
                    : 'Phim nổi bật'}
              </h1>
              <p className="text-gray-400">
                {searchQuery
                  ? `Tìm thấy ${movies.length} kết quả`
                  : isPhimFilterActive
                    ? 'Bộ sưu tập được chọn lọc '
                    : 'Khám phá bộ phim yêu thích tiếp theo của bạn'}
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
          ) : isPhimMode ? (
            phimItems.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-8 2xl:grid-cols-8 gap-4 md:gap-6">
                  {phimItems.map((item) => (
                    <PhimCard key={item._id || item.slug} item={item} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    maxPage={500}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Không tìm thấy nội dung phù hợp</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Xóa bộ lọc và thử lại
                  </button>
                )}
              </div>
            )
          ) : movies.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  maxPage={500}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Không tìm thấy phim nào</p>
              {hasActiveFilters && (
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
                  <h2 className="text-2xl font-bold text-white">
                    {isPhimMode ? 'Bộ lọc PhimAPI' : 'Phim nổi bật'}
                  </h2>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Filters */}
                <div className="space-y-6">
                  {isPhimMode ? (
                    <>
                      {/* Catalog */}
                      <div>
                        <h3 className="text-white font-medium mb-3">Danh mục:</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {PHIM_CATALOG_TYPES.map((catalog) => (
                            <button
                              key={catalog}
                              onClick={() => setSelectedPhimCatalog(catalog)}
                              className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimCatalog === catalog
                                ? 'bg-yellow-500 text-black font-medium'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                              {PHIM_CATALOG_LABELS[catalog]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Phim genres */}
                      <div>
                        <h3 className="text-white font-medium mb-3">Thể loại:</h3>
                        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                          <button
                            onClick={() => setSelectedPhimGenre('')}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimGenre === ''
                              ? 'bg-yellow-500 text-black font-medium'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              }`}
                          >
                            Tất cả
                          </button>
                          {phimGenres.length > 0 ? (
                            phimGenres.map((genre) => (
                              <button
                                key={genre.slug || genre._id || genre.name}
                                onClick={() => setSelectedPhimGenre(genre.slug || '')}
                                className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimGenre === (genre.slug || '')
                                  ? 'bg-yellow-500 text-black font-medium'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                  }`}
                              >
                                {genre.name}
                              </button>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">Đang tải thể loại...</p>
                          )}
                        </div>
                      </div>

                      {/* Phim countries */}
                      <div>
                        <h3 className="text-white font-medium mb-3">Quốc gia:</h3>
                        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                          <button
                            onClick={() => setSelectedPhimCountry('')}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimCountry === ''
                              ? 'bg-yellow-500 text-black font-medium'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              }`}
                          >
                            Tất cả
                          </button>
                          {phimCountries.length > 0 ? (
                            phimCountries.map((country) => (
                              <button
                                key={country.slug || country._id || country.name}
                                onClick={() => setSelectedPhimCountry(country.slug || '')}
                                className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimCountry === (country.slug || '')
                                  ? 'bg-yellow-500 text-black font-medium'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                  }`}
                              >
                                {country.name}
                              </button>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">Đang tải quốc gia...</p>
                          )}
                        </div>
                      </div>

                      {/* Year */}
                      <div>
                        <h3 className="text-white font-medium mb-3">Năm phát hành:</h3>
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            onClick={() => setSelectedPhimYear('')}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimYear === ''
                              ? 'bg-yellow-500 text-black font-medium'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              }`}
                          >
                            Tất cả
                          </button>
                          {years.map((year) => (
                            <button
                              key={year}
                              onClick={() => setSelectedPhimYear(year.toString())}
                              className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimYear === year.toString()
                                ? 'bg-yellow-500 text-black font-medium'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sort */}
                      <div>
                        <h3 className="text-white font-medium mb-3">Sắp xếp:</h3>
                        <div className="flex flex-wrap gap-2">
                          {PHIM_SORT_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSelectedPhimSortField(option.value)}
                              className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimSortField === option.value
                                ? 'bg-yellow-500 text-black font-medium'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {PHIM_SORT_TYPE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSelectedPhimSortType(option.value)}
                              className={`px-4 py-2 rounded-md text-sm transition-colors ${selectedPhimSortType === option.value
                                ? 'bg-yellow-500 text-black font-medium'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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