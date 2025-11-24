import { useQuery } from '@tanstack/react-query';
import { CatalogQuery, CatalogType, phimService } from '@/services/phimService';
import {
    PhimLatestResponse,
    PhimMovieDetailResponse,
    PhimCatalogResponse,
    PhimCatalogData,
    PhimCategoryListResponse,
    PhimCountryListResponse,
} from '@/types';

type Version = 'v1' | 'v2' | 'v3';
type PhimType = 'movie' | 'tv' | 'auto';

export const usePhim = () => {
    const useLatest = (options?: { page?: number; version?: Version }) => {
        return useQuery<PhimLatestResponse>({
            queryKey: ['phim', 'latest', options?.page ?? 1, options?.version ?? 'v1'],
            queryFn: async () => {
                const response = await phimService.getLatest(options);
                return (response.data ?? response) as PhimLatestResponse;
            },
            staleTime: 30 * 60 * 1000, // 30 minutes
            gcTime: 60 * 60 * 1000, // 1 hour
        });
    };

    const useMovieByTmdb = (tmdbId?: number, type: PhimType = 'auto', options?: { enabled?: boolean }) => {
        return useQuery<PhimMovieDetailResponse>({
            queryKey: ['phim', 'tmdb', type, tmdbId],
            queryFn: async () => {
                const response = await phimService.getMovieByTmdb(tmdbId as number, type);
                return (response.data ?? response) as PhimMovieDetailResponse;
            },
            enabled: Boolean(tmdbId) && (options?.enabled ?? true),
            staleTime: 5 * 60 * 1000,
        });
    };

    const useMovieBySlug = (slug?: string) => {
        return useQuery<PhimMovieDetailResponse>({
            queryKey: ['phim', 'slug', slug],
            queryFn: async () => {
                const response = await phimService.getMovieBySlug(slug || '');
                return (response.data ?? response) as PhimMovieDetailResponse;
            },
            enabled: Boolean(slug),
            staleTime: 5 * 60 * 1000,
        });
    };

    const useCatalogList = (type: CatalogType, params?: CatalogQuery, options?: { enabled?: boolean }) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery<PhimCatalogData>({
            queryKey: ['phim', 'catalog', type, keySuffix],
            queryFn: async () => {
                const response = await phimService.getCatalogList(type, params);
                // Backend structure: { success: true, data: { status, msg, data: { items: [...] } } }
                // We need to return the innermost data object (PhimCatalogData)
                if ('data' in response && response.data && 'data' in response.data) {
                    return response.data.data as PhimCatalogData;
                }
                if ('data' in response && response.data) {
                    return response.data as unknown as PhimCatalogData;
                }
                return response as unknown as PhimCatalogData;
            },
            enabled: options?.enabled ?? true,
            staleTime: 30 * 60 * 1000, // 30 minutes
            gcTime: 60 * 60 * 1000, // 1 hour
        });
    };

    const useGenreDetail = (slug?: string, params?: CatalogQuery, options?: { enabled?: boolean }) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery<PhimCatalogData>({
            queryKey: ['phim', 'genre', slug, keySuffix],
            queryFn: async () => {
                const response = await phimService.getGenreDetail(slug || '', params);
                // Backend structure: { success: true, data: { status, msg, data: { items: [...] } } }
                // We need to return the innermost data object (PhimCatalogData)
                if ('data' in response && response.data && 'data' in response.data) {
                    return response.data.data as PhimCatalogData;
                }
                if ('data' in response && response.data) {
                    return response.data as unknown as PhimCatalogData;
                }
                return response as unknown as PhimCatalogData;
            },
            enabled: Boolean(slug) && (options?.enabled ?? true),
            staleTime: 30 * 60 * 1000, // 30 minutes
            gcTime: 60 * 60 * 1000, // 1 hour
        });
    };

    const useCountryDetail = (slug?: string, params?: CatalogQuery) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery<PhimCatalogResponse>({
            queryKey: ['phim', 'country', slug, keySuffix],
            queryFn: async () => {
                const response = await phimService.getCountryDetail(slug || '', params);
                return (response.data ?? response) as PhimCatalogResponse;
            },
            enabled: Boolean(slug),
            staleTime: 2 * 60 * 1000,
        });
    };

    const useGenres = () => {
        return useQuery<PhimCategoryListResponse>({
            queryKey: ['phim', 'genres'],
            queryFn: async () => {
                const response = await phimService.getGenres();
                // Response có thể là ApiResponse hoặc trực tiếp là data
                if ('data' in response && Array.isArray(response.data)) {
                    return response.data as PhimCategoryListResponse;
                }
                return (Array.isArray(response) ? response : []) as PhimCategoryListResponse;
            },
            staleTime: 10 * 60 * 1000,
        });
    };

    const useCountries = () => {
        return useQuery<PhimCountryListResponse>({
            queryKey: ['phim', 'countries'],
            queryFn: async () => {
                const response = await phimService.getCountries();
                // Response có thể là ApiResponse hoặc trực tiếp là data
                if ('data' in response && Array.isArray(response.data)) {
                    return response.data as PhimCountryListResponse;
                }
                return (Array.isArray(response) ? response : []) as PhimCountryListResponse;
            },
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
