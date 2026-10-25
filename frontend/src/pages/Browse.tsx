import { useState, useEffect, useRef } from 'react';
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
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { getTranslatedGenre, getTranslatedCountry } from '@/utils/translations';
import { useTranslation } from 'react-i18next';

interface CertificationOption {
  code: string;
  name: string;
  description: string;
  tmdbCertification: string;
}

const CERTIFICATION_COUNTRY = 'US';

const CERTIFICATION_OPTIONS: CertificationOption[] = [
  { code: 'P', name: 'P', description: 'Mọi lứa tuổi', tmdbCertification: 'G' },
  {
    code: 'K',
    name: 'K',
    description: 'Dưới 13 tuổi',
    tmdbCertification: 'PG',
  },
  {
    code: 'T13',
    name: 'T13',
    description: '13 tuổi trở lên',
    tmdbCertification: 'PG-13',
  },
  {
    code: 'T16',
    name: 'T16',
    description: '16 tuổi trở lên',
    tmdbCertification: 'R',
  },
  {
    code: 'T18',
    name: 'T18',
    description: '18 tuổi trở lên',
    tmdbCertification: 'NC-17',
  },
];

const PHIM_CATALOG_TYPES: CatalogType[] = [
  'phim-bo',
  'phim-le',
  'tv-shows',
  'hoat-hinh',
  'phim-chieu-rap',
  'phim-vietsub',
  'phim-thuyet-minh',
  'phim-long-tieng',
];

const PHIM_PAGE_SIZE = 24;

type PhimSortField = '_id' | 'modified.time' | 'year';
type PhimSortType = 'asc' | 'desc';

const CATALOG_TITLE_KEYS: Record<CatalogType, string> = {
  'phim-le': 'browse.singleMovieList',
  'phim-bo': 'browse.seriesMovieList',
  'hoat-hinh': 'browse.animationList',
  'phim-chieu-rap': 'browse.cinemaList',
  'tv-shows': 'browse.tvShowsList',
  'phim-vietsub': 'browse.vietsubList',
  'phim-thuyet-minh': 'browse.dubbedList',
  'phim-long-tieng': 'browse.voiceoverList',
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

  // Progressive rendering states
  const [visibleMovieCount, setVisibleMovieCount] = useState(16); // Show 16 items initially
  const [visiblePhimCount, setVisiblePhimCount] = useState(16);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { t, i18n } = useTranslation();

  // Read initial values from URL params
  const searchQuery = searchParams.get('q') || '';
  const genreParam = searchParams.get('genre') || '';
  const countryParam = searchParams.get('country') || '';
  const catalogParamRaw = searchParams.get('catalog');
  const catalogFilter = isValidPhimCatalog(catalogParamRaw)
    ? catalogParamRaw
    : undefined;
  const phimGenreParam = searchParams.get('phimGenre') || '';
  const phimCountryParam = searchParams.get('phimCountry') || '';
  const phimYearParam = searchParams.get('phimYear') || '';
  const phimLangParam = searchParams.get('phimLang') || '';
  const phimSortFieldParam = searchParams.get('phimSortField');
  const phimSortTypeParam = searchParams.get('phimSortType');
  const phimSortField = isValidPhimSortField(phimSortFieldParam)
    ? phimSortFieldParam
    : 'modified.time';
  const phimSortType = isValidPhimSortType(phimSortTypeParam)
    ? phimSortTypeParam
    : 'desc';
  const sortParam = searchParams.get('sort_by') || 'popularity.desc';
  const yearParam = searchParams.get('year') || '';
  const ratingParam = searchParams.get('rating') || '';
  const isPhimFilterActive =
    !searchQuery &&
    (Boolean(catalogFilter) ||
      Boolean(phimGenreParam) ||
      Boolean(phimCountryParam) ||
      Boolean(phimYearParam) ||
      Boolean(phimLangParam) ||
      Boolean(phimSortFieldParam) ||
      Boolean(phimSortTypeParam));

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<string>(genreParam);
  const [selectedCountry, setSelectedCountry] = useState<string>(countryParam);
  const [selectedYear, setSelectedYear] = useState<string>(yearParam);
  const [selectedRating, setSelectedRating] = useState<string>(ratingParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [selectedPhimCatalog, setSelectedPhimCatalog] = useState<CatalogType>(
    catalogFilter ?? 'phim-le'
  );
  const [selectedPhimGenre, setSelectedPhimGenre] =
    useState<string>(phimGenreParam);
  const [selectedPhimCountry, setSelectedPhimCountry] =
    useState<string>(phimCountryParam);
  const [selectedPhimYear, setSelectedPhimYear] =
    useState<string>(phimYearParam);
  const [selectedPhimLang, setSelectedPhimLang] = useState(phimLangParam);
  const validPhimYear =
    !selectedPhimYear ||
    (/^\d{4}(,\d{4})?$/.test(selectedPhimYear) &&
      selectedPhimYear
        .split(',')
        .every((year) => Number(year) >= 1800 && Number(year) <= 2200) &&
      (!selectedPhimYear.includes(',') ||
        Number(selectedPhimYear.split(',')[0]) <=
          Number(selectedPhimYear.split(',')[1])));
  const [selectedPhimSortField, setSelectedPhimSortField] =
    useState<PhimSortField>(phimSortField);
  const [selectedPhimSortType, setSelectedPhimSortType] =
    useState<PhimSortType>(phimSortType);
  const { useGenres } = useMovies();
  const { data: genresData } = useGenres();
  const { useGenres: usePhimGenres, useCountries: usePhimCountries } =
    usePhim();
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
    setSelectedPhimCatalog(
      isValidPhimCatalog(catalogParam)
        ? (catalogParam as CatalogType)
        : 'phim-le'
    );
    setSelectedPhimGenre(searchParams.get('phimGenre') || '');
    setSelectedPhimCountry(searchParams.get('phimCountry') || '');
    setSelectedPhimYear(searchParams.get('phimYear') || '');
    setSelectedPhimLang(searchParams.get('phimLang') || '');

    const phimSortFieldParam = searchParams.get('phimSortField');
    setSelectedPhimSortField(
      isValidPhimSortField(phimSortFieldParam)
        ? phimSortFieldParam
        : 'modified.time'
    );

    const phimSortTypeParam = searchParams.get('phimSortType');
    setSelectedPhimSortType(
      isValidPhimSortType(phimSortTypeParam) ? phimSortTypeParam : 'desc'
    );
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
          const basePhimParams = {
            page,
            limit: PHIM_PAGE_SIZE,
            sort_field: phimSortField,
            sort_type: phimSortType,
            year: phimYearParam || undefined,
            sort_lang: (['vietsub', 'thuyet-minh', 'long-tieng'].includes(
              phimLangParam
            )
              ? phimLangParam
              : undefined) as
              | 'vietsub'
              | 'thuyet-minh'
              | 'long-tieng'
              | undefined,
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
            response = await phimService.getCatalogList(
              'phim-le',
              basePhimParams
            );
          }

          const payload = response?.data ?? response;

          if (!payload) {
            setPhimItems([]);
            setTotalPages(1);
            return;
          }

          const items = payload.items ?? payload.data?.items ?? [];
          setPhimItems(items.slice(0, PHIM_PAGE_SIZE));
          const pagination =
            payload.params?.pagination ?? payload.data?.params?.pagination;
          setTotalPages(getPhimTotalPages(pagination));
        } else {
          setIsPhimMode(false);
          let data;

          if (searchQuery) {
            // Search both TMDB and PhimAPI in parallel
            const [tmdbData, phimData] = await Promise.all([
              movieService.search(searchQuery, page),
              phimService
                .search(searchQuery, {
                  page,
                  limit: PHIM_PAGE_SIZE,
                })
                .catch(() => null),
            ]);

            // Set TMDB results
            setMovies(tmdbData.results);
            setTotalPages(tmdbData.total_pages);

            // Extract and set PhimAPI results
            const phimPayload = phimData?.data ?? phimData;
            const phimResults =
              phimPayload?.items ?? phimPayload?.data?.items ?? [];
            setPhimItems(phimResults.slice(0, PHIM_PAGE_SIZE));
          } else {
            // No search query - clear phim items and use normal TMDB discover
            setPhimItems([]);
            data = await movieService.discover({
              page,
              sort_by: sortBy,
              with_genres: selectedGenre,
              with_origin_country: selectedCountry || undefined,
              year: selectedYear ? parseInt(selectedYear) : undefined,
              certification_country: selectedCertification
                ? CERTIFICATION_COUNTRY
                : undefined,
              certification: selectedCertification?.tmdbCertification,
            });

            setMovies(data.results);
            setTotalPages(data.total_pages);
          }
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
    phimLangParam,
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
    // Reset visible counts when filters change
    setVisibleMovieCount(16);
    setVisiblePhimCount(16);
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
    phimLangParam,
    phimSortField,
    phimSortType,
    isPhimFilterActive,
  ]);

  // Progressive rendering - load more items when scrolling
  useEffect(() => {
    if (!loadMoreRef.current || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (isPhimMode && visiblePhimCount < phimItems.length) {
            setVisiblePhimCount((prev) => Math.min(prev + 8, phimItems.length));
          } else if (
            !isPhimMode &&
            !searchQuery &&
            visibleMovieCount < movies.length
          ) {
            setVisibleMovieCount((prev) => Math.min(prev + 8, movies.length));
          } else if (
            searchQuery &&
            (visibleMovieCount < movies.length ||
              visiblePhimCount < phimItems.length)
          ) {
            setVisibleMovieCount((prev) => Math.min(prev + 8, movies.length));
            setVisiblePhimCount((prev) => Math.min(prev + 8, phimItems.length));
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [
    isLoading,
    isPhimMode,
    phimItems.length,
    movies.length,
    searchQuery,
    visiblePhimCount,
    visibleMovieCount,
  ]);

  // Handle page change with scroll to top
  const handlePageChange = (newPage: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage(newPage);
  };

  const applyFilters = () => {
    if (isPhimMode) {
      if (!validPhimYear) return;
      const params: Record<string, string> = {};
      if (selectedPhimCatalog) params.catalog = selectedPhimCatalog;
      if (selectedPhimGenre) params.phimGenre = selectedPhimGenre;
      if (selectedPhimCountry) params.phimCountry = selectedPhimCountry;
      if (selectedPhimYear) params.phimYear = selectedPhimYear;
      if (selectedPhimLang) params.phimLang = selectedPhimLang;
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
      setSelectedPhimLang('');
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
    <Sheet open={showFilterModal} onOpenChange={setShowFilterModal}>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {searchQuery
                    ? t('browse.searchResults', { query: searchQuery })
                    : isPhimFilterActive
                      ? catalogFilter
                        ? t(CATALOG_TITLE_KEYS[catalogFilter])
                        : t('browse.movieList')
                      : t('browse.featuredMovies')}
                </h1>
                <p className="text-gray-400">
                  {searchQuery
                    ? t('browse.foundResults', { count: movies.length })
                    : isPhimFilterActive
                      ? t('browse.curatedCollection')
                      : t('browse.discoverNext')}
                </p>
              </div>
            </div>
            {!searchQuery && (
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  aria-label={t('browse.filter')}
                  className="shrink-0"
                >
                  <FiFilter size={17} />
                  <span className="hidden sm:inline">{t('browse.filter')}</span>
                </Button>
              </SheetTrigger>
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
                    {phimItems.slice(0, visiblePhimCount).map((item) => (
                      <PhimCard key={item._id || item.slug} item={item} />
                    ))}
                  </div>

                  {/* Load more sentinel */}
                  {visiblePhimCount < phimItems.length && (
                    <div ref={loadMoreRef} className="h-10" />
                  )}

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
                  <p className="text-gray-400 text-lg">
                    Không tìm thấy nội dung phù hợp
                  </p>
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
            ) : searchQuery ? (
              // Search mode: Show both TMDB and PhimAPI results combined
              movies.length > 0 || phimItems.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-8 2xl:grid-cols-8 gap-4 md:gap-6">
                    {/* PhimAPI Results */}
                    {phimItems.map((item) => (
                      <PhimCard key={item._id || item.slug} item={item} />
                    ))}

                    {/* TMDB Results */}
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
                  <p className="text-gray-400 text-lg">
                    Không tìm thấy phim nào
                  </p>
                </div>
              )
            ) : movies.length > 0 ? (
              // Normal browse mode
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
                  {movies.slice(0, visibleMovieCount).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>

                {/* Load more sentinel */}
                {visibleMovieCount < movies.length && (
                  <div ref={loadMoreRef} className="h-10" />
                )}

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

        <SheetContent closeLabel={t('common.close')}>
          <div className="border-b border-border px-6 pb-5 pt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-brand">
              RitoMovie
            </p>
            <SheetTitle>{t('browse.filter')}</SheetTitle>
            <SheetDescription className="mt-2">
              {t('browse.filterDescription')}
            </SheetDescription>
          </div>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">
            {isPhimMode ? (
              <>
                <Dropdown
                  label={t('browse.catalogLabel')}
                  value={selectedPhimCatalog}
                  onChange={(value) =>
                    setSelectedPhimCatalog(value as CatalogType)
                  }
                  options={PHIM_CATALOG_TYPES.map((value) => ({
                    value,
                    label: t(CATALOG_TITLE_KEYS[value]),
                  }))}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Combobox
                    label={t('header.genres')}
                    value={selectedPhimGenre}
                    onChange={setSelectedPhimGenre}
                    options={[
                      { value: '', label: t('browse.allGenres') },
                      ...phimGenres.map((item) => ({
                        value: item.slug,
                        label: getTranslatedGenre(item.name, i18n.language),
                      })),
                    ]}
                  />
                  <Combobox
                    label={t('header.countries')}
                    value={selectedPhimCountry}
                    onChange={setSelectedPhimCountry}
                    options={[
                      { value: '', label: t('browse.allCountries') },
                      ...phimCountries.map((item) => ({
                        value: item.slug,
                        label: getTranslatedCountry(item.name, i18n.language),
                      })),
                    ]}
                  />
                </div>
                <Dropdown
                  id="phim-language"
                  label={t('browse.audioLanguage')}
                  value={selectedPhimLang}
                  onChange={setSelectedPhimLang}
                  options={[
                    { value: '', label: t('browse.allLanguages') },
                    { value: 'vietsub', label: 'Vietsub' },
                    { value: 'thuyet-minh', label: t('browse.narrated') },
                    { value: 'long-tieng', label: t('browse.voiceDubbed') },
                  ]}
                />
                <Dropdown
                  label={t('browse.yearLabel')}
                  value={
                    selectedPhimYear.includes(',') ? 'range' : selectedPhimYear
                  }
                  onChange={(value) =>
                    setSelectedPhimYear(value === 'range' ? ',' : value)
                  }
                  options={[
                    { value: '', label: t('browse.allYears') },
                    { value: 'range', label: t('browse.yearRange') },
                    ...years.map((year) => ({
                      value: String(year),
                      label: String(year),
                    })),
                  ]}
                />
                {selectedPhimYear.includes(',') && (
                  <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t('browse.yearRange')}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        min="1800"
                        max="2200"
                        aria-label={t('browse.fromYear')}
                        placeholder={t('browse.fromYear')}
                        value={selectedPhimYear.split(',')[0]}
                        onChange={(event) =>
                          setSelectedPhimYear(
                            `${event.target.value},${selectedPhimYear.split(',')[1] || ''}`
                          )
                        }
                      />
                      <Input
                        type="number"
                        min="1800"
                        max="2200"
                        aria-label={t('browse.toYear')}
                        placeholder={t('browse.toYear')}
                        value={selectedPhimYear.split(',')[1]}
                        onChange={(event) =>
                          setSelectedPhimYear(
                            `${selectedPhimYear.split(',')[0] || ''},${event.target.value}`
                          )
                        }
                      />
                    </div>
                    {!validPhimYear && (
                      <p role="alert" className="text-xs text-red-400">
                        {t('browse.invalidYearRange')}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Dropdown
                    label={t('browse.sortLabel')}
                    value={selectedPhimSortField}
                    onChange={(value) =>
                      setSelectedPhimSortField(value as PhimSortField)
                    }
                    options={[
                      {
                        value: 'modified.time',
                        label: t('browse.sortUpdated'),
                      },
                      { value: 'year', label: t('browse.yearLabel') },
                      { value: '_id', label: t('browse.sortAdded') },
                    ]}
                  />
                  <Dropdown
                    label={t('browse.sortDirection')}
                    value={selectedPhimSortType}
                    onChange={(value) =>
                      setSelectedPhimSortType(value as PhimSortType)
                    }
                    options={[
                      { value: 'desc', label: t('browse.descending') },
                      { value: 'asc', label: t('browse.ascending') },
                    ]}
                  />
                </div>
              </>
            ) : (
              <>
                <Combobox
                  label={t('header.genres')}
                  value={selectedGenre}
                  onChange={setSelectedGenre}
                  options={[
                    { value: '', label: t('browse.allGenres') },
                    ...genres.map((item) => ({
                      value: String(item.id),
                      label: item.name,
                    })),
                  ]}
                />
                <Combobox
                  label={t('header.countries')}
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  options={[
                    { value: '', label: t('browse.allCountries') },
                    ...countries.map((item) => ({
                      value: item.code,
                      label: item.name,
                    })),
                  ]}
                />
                <Dropdown
                  label={t('browse.yearLabel')}
                  value={selectedYear}
                  onChange={setSelectedYear}
                  options={[
                    { value: '', label: t('browse.allYears') },
                    ...years.map((year) => ({
                      value: String(year),
                      label: String(year),
                    })),
                  ]}
                />
                <Dropdown
                  label={t('browse.certificationLabel')}
                  value={selectedRating}
                  onChange={setSelectedRating}
                  options={[
                    { value: '', label: t('browse.allRatings') },
                    ...CERTIFICATION_OPTIONS.map((item) => ({
                      value: item.code,
                      label: `${item.name} · ${item.description}`,
                    })),
                  ]}
                />
                <Dropdown
                  label={t('browse.sortLabel')}
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    {
                      value: 'popularity.desc',
                      label: t('browse.sortPopular'),
                    },
                    {
                      value: 'vote_average.desc',
                      label: t('browse.sortRating'),
                    },
                    {
                      value: 'release_date.desc',
                      label: t('browse.sortNewest'),
                    },
                  ]}
                />
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Button variant="ghost" onClick={clearFilters}>
              {t('browse.clearFilters')}
            </Button>
            <Button
              onClick={applyFilters}
              disabled={isPhimMode && !validPhimYear}
            >
              {t('browse.applyFilters')}
            </Button>
          </div>
        </SheetContent>
      </div>
    </Sheet>
  );
};

export default Browse;
