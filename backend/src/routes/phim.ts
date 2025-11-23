import express from 'express';
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
