import express from 'express';
import asyncHandler from '../utils/asyncHandler';
import { getHomeUpdates, getMovieExtras } from '../services/phimApiService';
import { getPlayableRecommendations } from '../services/recommendationService';
import ApiError from '../utils/ApiError';
import {
    fetchCatalogList,
    fetchCountries,
    fetchCountryDetail,
    fetchGenreDetail,
    fetchGenres,
    fetchLatestMovies,
    fetchMovieBySlug,
    fetchMovieByTmdb,
    fetchYearDetail,
    searchCatalog,
} from '../controllers/phimController';

const router = express.Router();

router.get('/recommendations', asyncHandler(async (req, res) => {
    const type = req.query.type;
    const slug = typeof req.query.slug === 'string' ? req.query.slug : undefined;
    const tmdbId = req.query.tmdbId === undefined ? undefined : Number(req.query.tmdbId);
    if ((type !== 'movie' && type !== 'tv') || (slug && slug.length > 200) ||
        (tmdbId !== undefined && (!Number.isSafeInteger(tmdbId) || tmdbId <= 0)) || (!slug && !tmdbId)) {
        throw new ApiError(400, 'Valid movie type and slug or TMDB ID are required');
    }
    const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] === 'vi' ? 'vi' : 'en';
    res.json({ success: true, data: await getPlayableRecommendations({ slug, tmdbId, type, language }) });
}));

router.get('/home', asyncHandler(async (req, res) => {
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    res.json({ success: true, data: await getHomeUpdates(page) });
}));
router.get('/movie/:slug/extras', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getMovieExtras(req.params.slug, (req as { language?: string }).language || 'en') });
}));

router.get('/latest', fetchLatestMovies);
router.get('/movie/:slug', fetchMovieBySlug);
router.get('/tmdb/:type/:id', fetchMovieByTmdb);
router.get('/search', searchCatalog);
router.get('/list/:type', fetchCatalogList);
router.get('/genres', fetchGenres);
router.get('/genres/:slug', fetchGenreDetail);
router.get('/countries', fetchCountries);
router.get('/countries/:slug', fetchCountryDetail);
router.get('/years/:year', fetchYearDetail);

export default router;
