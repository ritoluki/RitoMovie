import api from '@/lib/axios';
import type { PhimMovieMeta, PhimMovieSummary } from '@/types';

export interface MovieOverrides {
  titles: { vi?: string; en?: string };
  overviews: { vi?: string; en?: string };
  posterUrl?: string;
  backdropUrl?: string;
}
export interface ManagedMovie {
  _id: string; source: 'phimapi' | 'tmdb'; slug: string; title: string; original_title: string;
  poster_path?: string; release_date?: string; genres: string[]; vote_average?: number;
  mediaType: 'movie' | 'tv'; tmdb_id?: number; snapshot: PhimMovieMeta;
  isHidden: boolean; isFeatured: boolean; isTrending: boolean; overrides: MovieOverrides;
  effectiveHidden?: boolean;
}
export type MoviePatch = Partial<Pick<ManagedMovie, 'isHidden' | 'isFeatured' | 'isTrending' | 'overrides'>>;
export type BulkMovieAction = 'hide' | 'show' | 'feature' | 'unfeature' | 'trending' | 'untrending' | 'remove';
export interface MovieListParams { page?: number; limit?: number; search?: string; status?: string; genre?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
export interface Pagination { page: number; limit: number; total: number; pages: number }
export type SourceMovie = PhimMovieSummary & { managedId?: string; isHidden?: boolean };
interface List<T> { success: boolean; data: T[]; pagination: Pagination }
export const managedMovieService = {
  list: (params: MovieListParams) => api.get<List<ManagedMovie>>('/admin/movies', { params }),
  genres: () => api.get<{ success: boolean; data: Array<{ _id: string; count: number }> }>('/admin/genres'),
  source: (keyword: string, page: number) => api.get<List<SourceMovie>>('/admin/movies/source', { params: { keyword, page } }),
  import: (slug: string) => api.post<{ success: boolean; data: ManagedMovie }>('/admin/movies/import-phim', { slug }),
  update: (id: string, patch: MoviePatch) => api.put<{ success: boolean; data: ManagedMovie }>(`/admin/movies/${id}`, patch),
  remove: (id: string) => api.delete(`/admin/movies/${id}`),
  bulk: (action: BulkMovieAction, movieIds: string[]) => api.post('/admin/movies/bulk-action', { action, movieIds }),
};
export const movieErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error || 'The request failed');
