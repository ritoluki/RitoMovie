import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import {
    CatalogType,
    SortLang,
    SortType,
    Version,
    getCatalogList,
    getCountryDetail,
    getCountries,
    getGenreDetail,
    getGenres,
    getLatestMovies,
    getMovieBySlug,
    getMovieByTmdb,
    getYearDetail,
    searchMovies,
} from '../services/phimApiService';

const isValidVersion = (value?: string | null): value is Version => {
    if (!value) return false;
    return ['v1', 'v2', 'v3'].includes(value.toLowerCase());
};

const isValidSortField = (value?: string | null): value is '_id' | 'modified.time' | 'year' => {
    if (!value) return false;
    return ['_id', 'modified.time', 'year'].includes(value);
};

const isValidSortType = (value?: string | null): value is SortType => {
    if (!value) return false;
    return ['asc', 'desc'].includes(value.toLowerCase());
};

const isValidSortLang = (value?: string | null): value is SortLang => {
    if (!value) return false;
    return ['vietsub', 'thuyet-minh', 'long-tieng'].includes(value);
};

const isValidCatalogType = (value?: string | null): value is CatalogType => {
    if (!value) return false;
    return [
        'phim-bo',
        'phim-le',
        'tv-shows',
        'hoat-hinh',
        'phim-vietsub',
        'phim-thuyet-minh',
        'phim-long-tieng',
    ].includes(value);
};

const parseNumber = (value?: string | string[] | null, fallback?: number) => {
    if (!value) return fallback;
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseLimit = (value?: string | string[] | null) => {
    const parsed = parseNumber(value);
    if (!parsed) return undefined;
    return Math.min(Math.max(parsed, 1), 64);
};

// GET /api/phim/latest
export const fetchLatestMovies = asyncHandler(
    async (req: Request, res: Response) => {
        const page = parseNumber(req.query.page?.toString(), 1) || 1;
        const version = isValidVersion(req.query.version?.toString())
            ? (req.query.version!.toString().toLowerCase() as Version)
            : 'v1';

        const data = await getLatestMovies({ page, version });

        res.status(200).json({
            success: true,
            data,
        });
    }
);

// GET /api/phim/movie/:slug
export const fetchMovieBySlug = asyncHandler(
    async (req: Request, res: Response) => {
        const { slug } = req.params;

        if (!slug) {
            throw new ApiError(400, 'Movie slug is required');
        }

        const data = await getMovieBySlug(slug);

        res.status(200).json({
            success: true,
            data,
        });
    }
);

// GET /api/phim/tmdb/:type/:id
export const fetchMovieByTmdb = asyncHandler(
    async (req: Request, res: Response) => {
        const { type, id } = req.params;
        const tmdbId = parseInt(id, 10);
        const normalizedType = (type || '').toLowerCase();

        if (!['movie', 'tv', 'auto'].includes(normalizedType)) {
            throw new ApiError(400, 'type must be "movie", "tv" or "auto"');
        }

        if (Number.isNaN(tmdbId)) {
            throw new ApiError(400, 'TMDB id is invalid');
        }

        let data;

        if (normalizedType === 'auto') {
            try {
                data = await getMovieByTmdb('movie', tmdbId);
            } catch (error) {
                data = await getMovieByTmdb('tv', tmdbId);
            }
        } else {
            data = await getMovieByTmdb(normalizedType as 'movie' | 'tv', tmdbId);
        }

        res.status(200).json({
            success: true,
            data,
        });
    }
);

// GET /api/phim/search
export const searchCatalog = asyncHandler(
    async (req: Request, res: Response) => {
        const keyword = req.query.keyword?.toString();

        if (!keyword) {
            throw new ApiError(400, 'keyword is required');
        }

        const response = await searchMovies({
            keyword,
            page: parseNumber(req.query.page?.toString()),
            sort_field: isValidSortField(req.query.sort_field?.toString())
                ? (req.query.sort_field!.toString() as '_id' | 'modified.time' | 'year')
                : undefined,
            sort_type: isValidSortType(req.query.sort_type?.toString())
                ? (req.query.sort_type!.toString().toLowerCase() as SortType)
                : undefined,
            sort_lang: isValidSortLang(req.query.sort_lang?.toString())
                ? (req.query.sort_lang!.toString() as SortLang)
                : undefined,
            category: req.query.category?.toString(),
            country: req.query.country?.toString(),
            year: parseNumber(req.query.year?.toString()),
            limit: parseLimit(req.query.limit?.toString()),
        });

        res.status(200).json({
            success: true,
            data: response,
        });
    }
);

// GET /api/phim/list/:type
export const fetchCatalogList = asyncHandler(
    async (req: Request, res: Response) => {
        const { type } = req.params;

        if (!isValidCatalogType(type)) {
            throw new ApiError(400, 'Invalid catalog type');
        }

        const data = await getCatalogList(type, {
            page: parseNumber(req.query.page?.toString()),
            sort_field: isValidSortField(req.query.sort_field?.toString())
                ? (req.query.sort_field!.toString() as '_id' | 'modified.time' | 'year')
                : undefined,
            sort_type: isValidSortType(req.query.sort_type?.toString())
                ? (req.query.sort_type!.toString().toLowerCase() as SortType)
                : undefined,
            sort_lang: isValidSortLang(req.query.sort_lang?.toString())
                ? (req.query.sort_lang!.toString() as SortLang)
                : undefined,
            category: req.query.category?.toString(),
            country: req.query.country?.toString(),
            year: parseNumber(req.query.year?.toString()),
            limit: parseLimit(req.query.limit?.toString()),
        });

        res.status(200).json({
            success: true,
            data,
        });
    }
);

// GET /api/phim/genres
export const fetchGenres = asyncHandler(
    async (_req: Request, res: Response) => {
        const data = await getGenres();
        res.status(200).json({ success: true, data });
    }
);

// GET /api/phim/genres/:slug
export const fetchGenreDetail = asyncHandler(
    async (req: Request, res: Response) => {
        const { slug } = req.params;

        if (!slug) {
            throw new ApiError(400, 'genre slug is required');
        }

        const data = await getGenreDetail(slug, {
            page: parseNumber(req.query.page?.toString()),
            sort_field: isValidSortField(req.query.sort_field?.toString())
                ? (req.query.sort_field!.toString() as '_id' | 'modified.time' | 'year')
                : undefined,
            sort_type: isValidSortType(req.query.sort_type?.toString())
                ? (req.query.sort_type!.toString().toLowerCase() as SortType)
                : undefined,
            sort_lang: isValidSortLang(req.query.sort_lang?.toString())
                ? (req.query.sort_lang!.toString() as SortLang)
                : undefined,
            country: req.query.country?.toString(),
            year: parseNumber(req.query.year?.toString()),
            limit: parseLimit(req.query.limit?.toString()),
        });

        res.status(200).json({ success: true, data });
    }
);

// GET /api/phim/countries
export const fetchCountries = asyncHandler(
    async (_req: Request, res: Response) => {
        const data = await getCountries();
        res.status(200).json({ success: true, data });
    }
);

// GET /api/phim/countries/:slug
export const fetchCountryDetail = asyncHandler(
    async (req: Request, res: Response) => {
        const { slug } = req.params;

        if (!slug) {
            throw new ApiError(400, 'country slug is required');
        }

        const data = await getCountryDetail(slug, {
            page: parseNumber(req.query.page?.toString()),
            sort_field: isValidSortField(req.query.sort_field?.toString())
                ? (req.query.sort_field!.toString() as '_id' | 'modified.time' | 'year')
                : undefined,
            sort_type: isValidSortType(req.query.sort_type?.toString())
                ? (req.query.sort_type!.toString().toLowerCase() as SortType)
                : undefined,
            sort_lang: isValidSortLang(req.query.sort_lang?.toString())
                ? (req.query.sort_lang!.toString() as SortLang)
                : undefined,
            category: req.query.category?.toString(),
            year: parseNumber(req.query.year?.toString()),
            limit: parseLimit(req.query.limit?.toString()),
        });

        res.status(200).json({ success: true, data });
    }
);

// GET /api/phim/years/:year
export const fetchYearDetail = asyncHandler(
    async (req: Request, res: Response) => {
        const { year } = req.params;

        if (!year) {
            throw new ApiError(400, 'year is required');
        }

        const data = await getYearDetail(year, {
            page: parseNumber(req.query.page?.toString()),
            sort_field: isValidSortField(req.query.sort_field?.toString())
                ? (req.query.sort_field!.toString() as '_id' | 'modified.time' | 'year')
                : undefined,
            sort_type: isValidSortType(req.query.sort_type?.toString())
                ? (req.query.sort_type!.toString().toLowerCase() as SortType)
                : undefined,
            sort_lang: isValidSortLang(req.query.sort_lang?.toString())
                ? (req.query.sort_lang!.toString() as SortLang)
                : undefined,
            category: req.query.category?.toString(),
            country: req.query.country?.toString(),
            limit: parseLimit(req.query.limit?.toString()),
        });

        res.status(200).json({ success: true, data });
    }
);
