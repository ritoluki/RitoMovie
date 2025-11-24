import axios from 'axios';
import ApiError from '../utils/ApiError';

const PHIM_API_BASE_URL = process.env.PHIM_API_BASE_URL || 'https://phimapi.com';

export type Version = 'v1' | 'v2' | 'v3';

export type SortType = 'asc' | 'desc';

export type SortLang = 'vietsub' | 'thuyet-minh' | 'long-tieng';

export type CatalogType =
    | 'phim-bo'
    | 'phim-le'
    | 'tv-shows'
    | 'hoat-hinh'
    | 'phim-chieu-rap'
    | 'phim-vietsub'
    | 'phim-thuyet-minh'
    | 'phim-long-tieng';

type Nullable<T> = {
    [K in keyof T]: T[K] | undefined;
};

const phimAxios = axios.create({
    baseURL: PHIM_API_BASE_URL,
    timeout: 15000,
});

interface StatusPayload {
    status: boolean;
    msg?: string;
}

const isStatusPayload = (payload: unknown): payload is StatusPayload => {
    return Boolean(payload && typeof payload === 'object' && 'status' in payload);
};

const ensureSuccess = <T>(payload: unknown): T => {
    if (isStatusPayload(payload)) {
        if (!payload.status) {
            throw new ApiError(404, payload.msg || 'PhimAPI request failed');
        }
        return payload as T;
    }

    if (!payload) {
        throw new ApiError(404, 'Empty response from PhimAPI');
    }

    return payload as T;
};

const buildQuery = (params: Record<string, unknown>) => {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
};

export const getLatestMovies = async (options?: { page?: number; version?: Version }) => {
    const version = options?.version ?? 'v1';
    const suffix = version === 'v1' ? '' : `-${version}`;
    const response = await phimAxios.get(`/danh-sach/phim-moi-cap-nhat${suffix}`, {
        params: buildQuery({ page: options?.page ?? 1 }),
    });

    return ensureSuccess(response.data);
};

export const getMovieBySlug = async (slug: string) => {
    const response = await phimAxios.get(`/phim/${slug}`);
    return ensureSuccess(response.data);
};

export const getMovieByTmdb = async (type: 'movie' | 'tv', tmdbId: number) => {
    const response = await phimAxios.get(`/tmdb/${type}/${tmdbId}`);
    return ensureSuccess(response.data);
};

export const searchMovies = async (
    params: Nullable<{
        keyword: string;
        page?: number;
        sort_field?: '_id' | 'modified.time' | 'year';
        sort_type?: SortType;
        sort_lang?: SortLang;
        category?: string;
        country?: string;
        year?: number;
        limit?: number;
    }>
) => {
    if (!params.keyword) {
        throw new ApiError(400, 'keyword is required');
    }

    const response = await phimAxios.get('/v1/api/tim-kiem', {
        params: buildQuery({
            keyword: params.keyword,
            page: params.page,
            sort_field: params.sort_field,
            sort_type: params.sort_type,
            sort_lang: params.sort_lang,
            category: params.category,
            country: params.country,
            year: params.year,
            limit: params.limit,
        }),
    });

    return ensureSuccess(response.data);
};

export const getCatalogList = async (
    type: CatalogType,
    params?: Nullable<{
        page?: number;
        sort_field?: '_id' | 'modified.time' | 'year';
        sort_type?: SortType;
        sort_lang?: SortLang;
        category?: string;
        country?: string;
        year?: number;
        limit?: number;
    }>
) => {
    const response = await phimAxios.get(`/v1/api/danh-sach/${type}`, {
        params: buildQuery({
            page: params?.page,
            sort_field: params?.sort_field,
            sort_type: params?.sort_type,
            sort_lang: params?.sort_lang,
            category: params?.category,
            country: params?.country,
            year: params?.year,
            limit: params?.limit,
        }),
    });

    return ensureSuccess(response.data);
};

export const getGenres = async () => {
    const response = await phimAxios.get('/the-loai');
    return ensureSuccess(response.data);
};

export const getGenreDetail = async (
    slug: string,
    params?: Nullable<{
        page?: number;
        sort_field?: '_id' | 'modified.time' | 'year';
        sort_type?: SortType;
        sort_lang?: SortLang;
        country?: string;
        year?: number;
        limit?: number;
    }>
) => {
    const response = await phimAxios.get(`/v1/api/the-loai/${slug}`, {
        params: buildQuery({
            page: params?.page,
            sort_field: params?.sort_field,
            sort_type: params?.sort_type,
            sort_lang: params?.sort_lang,
            country: params?.country,
            year: params?.year,
            limit: params?.limit,
        }),
    });

    return ensureSuccess(response.data);
};

export const getCountries = async () => {
    const response = await phimAxios.get('/quoc-gia');
    return ensureSuccess(response.data);
};

export const getCountryDetail = async (
    slug: string,
    params?: Nullable<{
        page?: number;
        sort_field?: '_id' | 'modified.time' | 'year';
        sort_type?: SortType;
        sort_lang?: SortLang;
        category?: string;
        year?: number;
        limit?: number;
    }>
) => {
    const response = await phimAxios.get(`/v1/api/quoc-gia/${slug}`, {
        params: buildQuery({
            page: params?.page,
            sort_field: params?.sort_field,
            sort_type: params?.sort_type,
            sort_lang: params?.sort_lang,
            category: params?.category,
            year: params?.year,
            limit: params?.limit,
        }),
    });

    return ensureSuccess(response.data);
};

export const getYearDetail = async (
    year: string,
    params?: Nullable<{
        page?: number;
        sort_field?: '_id' | 'modified.time' | 'year';
        sort_type?: SortType;
        sort_lang?: SortLang;
        category?: string;
        country?: string;
        limit?: number;
    }>
) => {
    const response = await phimAxios.get(`/v1/api/nam/${year}`, {
        params: buildQuery({
            page: params?.page,
            sort_field: params?.sort_field,
            sort_type: params?.sort_type,
            sort_lang: params?.sort_lang,
            category: params?.category,
            country: params?.country,
            limit: params?.limit,
        }),
    });

    return ensureSuccess(response.data);
};
