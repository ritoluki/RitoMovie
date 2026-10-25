import axios from '@/lib/axios';
import {
    ApiResponse,
    PhimCatalogResponse,
    PhimCategoryListResponse,
    PhimCountryListResponse,
    PhimLatestResponse,
    PhimMovieDetailResponse,
    PhimMovieExtras,
    PlayableRecommendations,
} from '@/types';

type PhimType = 'movie' | 'tv' | 'auto';

type Version = 'v1' | 'v2' | 'v3';

export type CatalogType =
    | 'phim-bo'
    | 'phim-le'
    | 'tv-shows'
    | 'hoat-hinh'
    | 'phim-chieu-rap'
    | 'phim-vietsub'
    | 'phim-thuyet-minh'
    | 'phim-long-tieng';

export type CatalogQuery = {
    page?: number;
    sort_field?: '_id' | 'modified.time' | 'year';
    sort_type?: 'asc' | 'desc';
    sort_lang?: 'vietsub' | 'thuyet-minh' | 'long-tieng';
    category?: string;
    country?: string;
    year?: number | string;
    limit?: number;
};

type DetailQuery = Omit<CatalogQuery, 'category' | 'country'> & {
    category?: string;
    country?: string;
};

export const phimService = {
    getRecommendations: async (params: { slug?: string; tmdbId?: number; type: 'movie' | 'tv' }) =>
        (await axios.get<ApiResponse<PlayableRecommendations>>('/phim/recommendations', { params })).data,
    getHome: async (page = 1) => axios.get<ApiResponse<PhimCatalogResponse>>('/phim/home', { params: { page } }),
    getExtras: async (slug: string) => axios.get<ApiResponse<PhimMovieExtras>>(`/phim/movie/${encodeURIComponent(slug)}/extras`),
    getLatest: async (options?: { page?: number; version?: Version }): Promise<ApiResponse<PhimLatestResponse>> => {
        const response = await axios.get<ApiResponse<PhimLatestResponse>>('/phim/latest', {
            params: {
                page: options?.page,
                version: options?.version,
            },
        });

        return response;
    },

    getMovieBySlug: async (slug: string): Promise<ApiResponse<PhimMovieDetailResponse>> => {
        const response = await axios.get<ApiResponse<PhimMovieDetailResponse>>(`/phim/movie/${slug}`);
        return response;
    },

    getMovieByTmdb: async (tmdbId: number, type: PhimType = 'auto'): Promise<ApiResponse<PhimMovieDetailResponse>> => {
        const response = await axios.get<ApiResponse<PhimMovieDetailResponse>>(`/phim/tmdb/${type}/${tmdbId}`);
        return response;
    },

    getCatalogList: async (type: CatalogType, params?: CatalogQuery): Promise<ApiResponse<PhimCatalogResponse>> => {
        const response = await axios.get<ApiResponse<PhimCatalogResponse>>(`/phim/list/${type}`, {
            params,
        });

        return response;
    },

    getGenres: async (): Promise<ApiResponse<PhimCategoryListResponse>> => {
        const response = await axios.get<ApiResponse<PhimCategoryListResponse>>('/phim/genres');
        return response;
    },

    getCountries: async (): Promise<ApiResponse<PhimCountryListResponse>> => {
        const response = await axios.get<ApiResponse<PhimCountryListResponse>>('/phim/countries');
        return response;
    },

    getGenreDetail: async (slug: string, params?: DetailQuery): Promise<ApiResponse<PhimCatalogResponse>> => {
        const response = await axios.get<ApiResponse<PhimCatalogResponse>>(`/phim/genres/${slug}`, {
            params,
        });

        return response;
    },

    getCountryDetail: async (slug: string, params?: DetailQuery): Promise<ApiResponse<PhimCatalogResponse>> => {
        const response = await axios.get<ApiResponse<PhimCatalogResponse>>(`/phim/countries/${slug}`, {
            params,
        });

        return response;
    },

    search: async (keyword: string, params?: Omit<CatalogQuery, 'category' | 'country'>): Promise<ApiResponse<PhimCatalogResponse>> => {
        const response = await axios.get<ApiResponse<PhimCatalogResponse>>('/phim/search', {
            params: {
                keyword,
                ...params,
            },
        });

        return response;
    },
};
