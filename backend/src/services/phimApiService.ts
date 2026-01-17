import axios from 'axios';
import ApiError from '../utils/ApiError';

const PHIM_API_BASE_URL = process.env.PHIM_API_BASE_URL || 'https://phimapi.com';

// Cache manager for failed requests
interface CacheEntry {
    timestamp: number;
    errorType: 'NOT_FOUND' | 'TIMEOUT' | 'ERROR';
}

class CacheManager {
    private cache: Map<string, CacheEntry> = new Map();
    private pendingRequests: Map<string, Promise<unknown>> = new Map();
    private readonly maxSize = 10000;
    private readonly ttl = {
        NOT_FOUND: 60 * 60 * 1000, // 1 hour for 404s (unlikely to change)
        TIMEOUT: 5 * 60 * 1000,    // 5 minutes for timeouts (may be temporary)
        ERROR: 10 * 60 * 1000,     // 10 minutes for other errors
    };

    isInCache(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        const now = Date.now();
        const ttl = this.ttl[entry.errorType];

        if (now - entry.timestamp > ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    addToCache(key: string, errorType: CacheEntry['errorType']): void {
        // LRU eviction: remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            timestamp: Date.now(),
            errorType,
        });
    }

    getPendingRequest<T>(key: string): Promise<T> | undefined {
        return this.pendingRequests.get(key) as Promise<T> | undefined;
    }

    setPendingRequest<T>(key: string, promise: Promise<T>): void {
        this.pendingRequests.set(key, promise);

        // Clean up after request completes
        promise.finally(() => {
            this.pendingRequests.delete(key);
        });
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            pendingRequests: this.pendingRequests.size,
        };
    }
}

const cacheManager = new CacheManager();

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
    timeout: 30000, // Increased timeout to 30 seconds
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'RitoMovie/1.0',
    },
});

// Add response interceptor for better error handling
phimAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.warn(`[PhimAPI] Request timeout: ${error.config?.url}`);
        } else if (error.response?.status === 404) {
            console.warn(`[PhimAPI] Resource not found: ${error.config?.url}`);
        } else {
            console.error(`[PhimAPI] Request failed: ${error.message}`);
        }
        throw error;
    }
);

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
    const cacheKey = `tmdb:${type}:${tmdbId}`;

    // Check if this request previously failed
    if (cacheManager.isInCache(cacheKey)) {
        console.debug(`[PhimAPI] Skipping cached failed request: ${cacheKey}`);
        return null; // Return null instead of throwing error
    }

    // Check if there's already a pending request for this ID (deduplication)
    const pendingRequest = cacheManager.getPendingRequest<unknown>(cacheKey);
    if (pendingRequest) {
        console.debug(`[PhimAPI] Reusing pending request: ${cacheKey}`);
        return pendingRequest;
    }

    // Create new request
    const requestPromise = (async () => {
        try {
            const response = await phimAxios.get(`/tmdb/${type}/${tmdbId}`);
            return ensureSuccess(response.data);
        } catch (error: unknown) {
            // Classify error type
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    // 404: TMDB ID doesn't exist in PhimAPI - cache it
                    cacheManager.addToCache(cacheKey, 'NOT_FOUND');
                    console.debug(`[PhimAPI] TMDB ID not found, cached: ${cacheKey}`);
                    return null;
                } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                    // Timeout: may be temporary - cache with shorter TTL
                    cacheManager.addToCache(cacheKey, 'TIMEOUT');
                    console.warn(`[PhimAPI] Request timeout, cached: ${cacheKey}`);
                    return null;
                }
            }

            // Other errors: cache with medium TTL
            cacheManager.addToCache(cacheKey, 'ERROR');
            console.error(`[PhimAPI] Request failed: ${cacheKey}`, error);
            return null;
        }
    })();

    // Store pending request for deduplication
    cacheManager.setPendingRequest(cacheKey, requestPromise);

    return requestPromise;
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

// Export cache stats for monitoring/debugging
export const getCacheStats = () => cacheManager.getCacheStats();

