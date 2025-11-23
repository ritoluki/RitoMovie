import { useQuery } from '@tanstack/react-query';
import { CatalogQuery, CatalogType, phimService } from '@/services/phimService';

type Version = 'v1' | 'v2' | 'v3';
type PhimType = 'movie' | 'tv' | 'auto';

export const usePhim = () => {
    const useLatest = (options?: { page?: number; version?: Version }) => {
        return useQuery({
            queryKey: ['phim', 'latest', options?.page ?? 1, options?.version ?? 'v1'],
            queryFn: () => phimService.getLatest(options),
            staleTime: 60 * 1000,
        });
    };

    const useMovieByTmdb = (tmdbId?: number, type: PhimType = 'auto') => {
        return useQuery({
            queryKey: ['phim', 'tmdb', type, tmdbId],
            queryFn: () => phimService.getMovieByTmdb(tmdbId as number, type),
            enabled: Boolean(tmdbId),
            staleTime: 5 * 60 * 1000,
        });
    };

    const useMovieBySlug = (slug?: string) => {
        return useQuery({
            queryKey: ['phim', 'slug', slug],
            queryFn: () => phimService.getMovieBySlug(slug || ''),
            enabled: Boolean(slug),
            staleTime: 5 * 60 * 1000,
        });
    };

    const useCatalogList = (type: CatalogType, params?: CatalogQuery) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery({
            queryKey: ['phim', 'catalog', type, keySuffix],
            queryFn: () => phimService.getCatalogList(type, params),
            staleTime: 2 * 60 * 1000,
        });
    };

    const useGenreDetail = (slug?: string, params?: CatalogQuery) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery({
            queryKey: ['phim', 'genre', slug, keySuffix],
            queryFn: () => phimService.getGenreDetail(slug || '', params),
            enabled: Boolean(slug),
            staleTime: 2 * 60 * 1000,
        });
    };

    const useCountryDetail = (slug?: string, params?: CatalogQuery) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery({
            queryKey: ['phim', 'country', slug, keySuffix],
            queryFn: () => phimService.getCountryDetail(slug || '', params),
            enabled: Boolean(slug),
            staleTime: 2 * 60 * 1000,
        });
    };

    const useGenres = () => {
        return useQuery({
            queryKey: ['phim', 'genres'],
            queryFn: () => phimService.getGenres(),
            staleTime: 10 * 60 * 1000,
        });
    };

    const useCountries = () => {
        return useQuery({
            queryKey: ['phim', 'countries'],
            queryFn: () => phimService.getCountries(),
            staleTime: 10 * 60 * 1000,
        });
    };

    return {
        useLatest,
        useMovieBySlug,
        useMovieByTmdb,
        useCatalogList,
        useGenreDetail,
        useCountryDetail,
        useGenres,
        useCountries,
    };
};
