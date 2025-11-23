// Movie types from TMDB
export interface Movie {
  id: number;
  title: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
  video: boolean;
  episode_run_time?: number[];
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  homepage: string;
  imdb_id: string;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  release_dates?: ReleaseDatesResponse;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Country {
  iso_3166_1: string;
  english_name: string;
  native_name?: string;
}

export interface ReleaseDate {
  certification: string;
  descriptors: string[];
  iso_639_1: string;
  note: string;
  release_date: string;
  type: number;
}

export interface ReleaseDateResult {
  iso_3166_1: string;
  release_dates: ReleaseDate[];
}

export interface ReleaseDatesResponse {
  id: number;
  results: ReleaseDateResult[];
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: Cast[];
  crew: Crew[];
}

export interface MovieImage {
  aspect_ratio: number;
  file_path: string;
  height: number;
  width: number;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
}

export interface MovieImages {
  id: number;
  backdrops: MovieImage[];
  posters: MovieImage[];
  logos: MovieImage[];
}

// User types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  watchlist: number[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Watch history
export interface WatchHistory {
  _id: string;
  movieId: number;
  progress: number;
  duration: number;
  lastWatched: string;
  completed: boolean;
}

// Rating
export interface Rating {
  _id: string;
  movieId: number;
  rating: number;
  review?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
  total_results: number;
}

// Custom movie with video
export interface CustomMovie {
  _id: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  videoUrl: string;
  duration: number;
  quality: string[];
  tmdbId?: number;
  genres: string[];
  releaseDate: string;
  rating: number;
  createdAt: string;
}

// Search params
export interface SearchParams {
  query?: string;
  page?: number;
  genre?: number;
  year?: number;
  sort_by?: string;
}

// PhimAPI types
export interface PhimMovieTmdbInfo {
  type: string | null;
  id: string | null;
  season?: number | null;
  vote_average?: number;
  vote_count?: number;
}

export interface PhimMovieImdbInfo {
  id: string | null;
}

export interface PhimMovieSummary {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  type?: string;
  time?: string;
  episode_current?: string;
  episode_total?: string;
  quality?: string;
  lang?: string;
  lang_name?: string;
  chieurap?: boolean;
  sub_docquyen?: boolean;
  category?: PhimMovieCategory[];
  country?: PhimMovieCategory[];
  tmdb?: PhimMovieTmdbInfo;
  imdb?: PhimMovieImdbInfo;
}

export interface PhimPagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

export interface PhimLatestResponse {
  status: boolean;
  msg: string;
  items: PhimMovieSummary[];
  pagination: PhimPagination;
}

export interface PhimMovieCategory {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
}

export type PhimCategoryListResponse = PhimMovieCategory[];

export type PhimCountryListResponse = PhimMovieCategory[];

export interface PhimEpisodeSource {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface PhimEpisodeServer {
  server_name: string;
  server_data: PhimEpisodeSource[];
}

export interface PhimMovieMeta {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  content: string;
  type: string;
  status: string;
  poster_url: string;
  thumb_url: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  notify: string;
  showtimes: string;
  year: number;
  actor: string[];
  director: string[];
  category: PhimMovieCategory[];
  country: PhimMovieCategory[];
  trailer_url?: string;
  lang_name?: string;
  chieurap?: boolean;
  tmdb?: PhimMovieTmdbInfo;
}

export interface PhimMovieDetailResponse {
  status: boolean;
  msg: string;
  movie: PhimMovieMeta;
  episodes: PhimEpisodeServer[];
}

export interface PhimCatalogParams {
  type_slug?: string;
  filterCategory?: string[];
  filterCountry?: string[];
  filterYear?: string[];
  filterType?: string[];
  sortField?: string;
  sortType?: string;
  pagination?: PhimPagination;
}

export interface PhimCatalogData {
  seoOnPage?: Record<string, unknown>;
  breadCrumb?: Array<Record<string, unknown>>;
  titlePage?: string;
  items: PhimMovieSummary[];
  params?: PhimCatalogParams;
  type_list?: string;
  APP_DOMAIN_FRONTEND?: string;
  APP_DOMAIN_CDN_IMAGE?: string;
}

export interface PhimCatalogResponse {
  status: boolean;
  msg: string;
  data: PhimCatalogData;
}

