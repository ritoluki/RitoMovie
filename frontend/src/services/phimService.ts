import axios from '@/lib/axios';
import {
    ApiResponse,
    PhimCatalogResponse,
    PhimCategoryListResponse,
    PhimCountryListResponse,
    PhimLatestResponse,
    PhimMovieDetailResponse,
} from '@/types';

type PhimType = 'movie' | 'tv' | 'auto';

type Version = 'v1' | 'v2' | 'v3';

export type CatalogType =
    | 'phim-bo'
    | 'phim-le'
    | 'tv-shows'
    | 'hoat-hinh'
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
    year?: number;
    limit?: number;
};

type DetailQuery = Omit<CatalogQuery, 'category' | 'country'> & {
    country?: string;
};

export const phimService = {
    getLatest: async (options?: { page?: number; version?: Version }): Promise<PhimLatestResponse> => {
        const response = await axios.get<ApiResponse<PhimLatestResponse>>('/phim/latest', {
            params: {
                page: options?.page,
                version: options?.version,
            },
        });

        return response.data;
    },

    getMovieBySlug: async (slug: string): Promise<PhimMovieDetailResponse> => {
        const response = await axios.get<ApiResponse<PhimMovieDetailResponse>>(`/phim/movie/${slug}`);
        return response.data;
    },

    getMovieByTmdb: async (tmdbId: number, type: PhimType = 'auto'): Promise<PhimMovieDetailResponse> => {
        const response = await axios.get<ApiResponse<PhimMovieDetailResponse>>(`/phim/tmdb/${type}/${tmdbId}`);
        return response.data;
    },

    getCatalogList: async (type: CatalogType, params?: CatalogQuery): Promise<PhimCatalogResponse> => {
        const response = await axios.get<ApiResponse<PhimCatalogResponse>>(`/phim/list/${type}`, {
            params,
        });

        return response.data;
    },

    getGenres: async (): Promise<ApiResponse<PhimCategoryListResponse>> => {
        const response = await axios.get<ApiResponse<PhimCategoryListResponse>>('/phim/genres');
        return response.data;
    },

    getCountries: async (): Promise<ApiResponse<PhimCountryListResponse>> => {
        const response = await axios.get<ApiResponse<PhimCountryListResponse>>('/phim/countries');
        return response.data;
    },

    getGenreDetail: async (slug: string, params?: DetailQuery): Promise<ApiResponse<PhimCatalogResponse>> => {
        const response = await axios.get<ApiResponse<PhimCatalogResponse>>(`/phim/genres/${slug}`, {
            params,
        });

        return response.data;
    },

    getCountryDetail: async (slug: string, params?: DetailQuery): Promise<ApiResponse<PhimCatalogResponse>> => {
        const response = await axios.get<ApiResponse<PhimCatalogResponse>>(`/phim/countries/${slug}`, {
            params,
        });

        return response.data;
    },
};
