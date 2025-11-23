import { useQuery } from '@tanstack/react-query';
import { CatalogQuery, CatalogType, phimService } from '@/services/phimService';

type Version = 'v1' | 'v2' | 'v3';
type PhimType = 'movie' | 'tv' | 'auto';

export const usePhim = () => {
    const useLatest = (options?: { page?: number; version?: Version }) => {
        return useQuery({
            queryKey: ['phim', 'latest', options?.page ?? 1, options?.version ?? 'v1'],
            queryFn: async () => {
                const response = await phimService.getLatest(options);
                return response.data ?? response;
            },
            staleTime: 60 * 1000,
        });
    };

    const useMovieByTmdb = (tmdbId?: number, type: PhimType = 'auto') => {
        return useQuery({
            queryKey: ['phim', 'tmdb', type, tmdbId],
            queryFn: async () => {
                const response = await phimService.getMovieByTmdb(tmdbId as number, type);
                return response.data ?? response;
            },
            enabled: Boolean(tmdbId),
            staleTime: 5 * 60 * 1000,
        });
    };

    const useMovieBySlug = (slug?: string) => {
        return useQuery({
            queryKey: ['phim', 'slug', slug],
            queryFn: async () => {
                const response = await phimService.getMovieBySlug(slug || '');
                return response.data ?? response;
            },
            enabled: Boolean(slug),
            staleTime: 5 * 60 * 1000,
        });
    };

    const useCatalogList = (type: CatalogType, params?: CatalogQuery) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery({
            queryKey: ['phim', 'catalog', type, keySuffix],
            queryFn: async () => {
                const response = await phimService.getCatalogList(type, params);
                return response.data ?? response;
            },
            staleTime: 2 * 60 * 1000,
        });
    };

    const useGenreDetail = (slug?: string, params?: CatalogQuery) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery({
            queryKey: ['phim', 'genre', slug, keySuffix],
            queryFn: async () => {
                const response = await phimService.getGenreDetail(slug || '', params);
                return response.data ?? response;
            },
            enabled: Boolean(slug),
            staleTime: 2 * 60 * 1000,
        });
    };

    const useCountryDetail = (slug?: string, params?: CatalogQuery) => {
        const keySuffix = params ? JSON.stringify(params) : 'default';
        return useQuery({
            queryKey: ['phim', 'country', slug, keySuffix],
            queryFn: async () => {
                const response = await phimService.getCountryDetail(slug || '', params);
                return response.data ?? response;
            },
            enabled: Boolean(slug),
            staleTime: 2 * 60 * 1000,
        });
    };

    const useGenres = () => {
        return useQuery({
            queryKey: ['phim', 'genres'],
            queryFn: async () => {
                const response = await phimService.getGenres();
                // Response có thể là ApiResponse hoặc trực tiếp là data
                if ('data' in response && Array.isArray(response.data)) {
                    return response.data;
                }
                return Array.isArray(response) ? response : [];
            },
            staleTime: 10 * 60 * 1000,
        });
    };

    const useCountries = () => {
        return useQuery({
            queryKey: ['phim', 'countries'],
            queryFn: async () => {
                const response = await phimService.getCountries();
                // Response có thể là ApiResponse hoặc trực tiếp là data
                if ('data' in response && Array.isArray(response.data)) {
                    return response.data;
                }
                return Array.isArray(response) ? response : [];
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
