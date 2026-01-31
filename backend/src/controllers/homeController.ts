import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import * as tmdbService from '../services/tmdbService';
import * as phimApiService from '../services/phimApiService';
import { homeCache, CACHE_TTL } from '../utils/cache';

// Helper to get language from i18n middleware
const getLanguage = (req: Request): string => {
    return (req as { language?: string }).language || 'en';
};

/**
 * @desc    Get all home page data in a single batch request
 * @route   GET /api/movies/home-batch
 * @access  Public
 * 
 * This endpoint combines multiple API calls into one to reduce network requests
 * and improve initial page load performance.
 * 
 * OPTIMIZATION: 
 * - Each individual API call is already cached at service level
 * - The batch response is also cached for 2 minutes for identical requests
 * - After cache warm-up, response time is typically < 50ms
 * 
 * Returns:
 * - trending: Trending movies for hero banner and top section
 * - popular: Popular movies
 * - topRated: Top rated movies
 * - genres: Action, Comedy, Horror, Romance movies
 * - phim: Vietnamese content (phim-bo, hoat-hinh, tv-shows)
 * - phimGenres: Action and Comedy Vietnamese shows
 */
export const getHomePageBatch = asyncHandler(
    async (req: Request, res: Response) => {
        const language = getLanguage(req);
        const cacheKey = `home:batch:${language}`;

        // Check if we have cached batch response
        const cachedResponse = homeCache.get<object>(cacheKey);
        if (cachedResponse) {
            return res.status(200).json({
                success: true,
                data: cachedResponse,
                cached: true,
                timestamp: new Date().toISOString(),
            });
        }

        const startTime = Date.now();

        try {
            // Execute all requests in parallel for maximum performance
            // Note: Each service call is individually cached
            const [
                trending,
                popular,
                topRated,
                actionMovies,
                comedyMovies,
                horrorMovies,
                romanceMovies,
                phimBo,
                anime,
                tvShows,
                actionTv,
                comedyTv,
            ] = await Promise.allSettled([
                // TMDB API calls
                tmdbService.getTrendingMovies('week', language),
                tmdbService.getPopularMovies(1, language),
                tmdbService.getTopRatedMovies(1, language),
                tmdbService.getMoviesByGenre(28, 1, language), // Action
                tmdbService.getMoviesByGenre(35, 1, language), // Comedy
                tmdbService.getMoviesByGenre(27, 1, language), // Horror
                tmdbService.getMoviesByGenre(10749, 1, language), // Romance

                // Phim API calls
                phimApiService.getCatalogList('phim-bo', { page: 1, limit: 20 }),
                phimApiService.getCatalogList('hoat-hinh', { page: 1, limit: 20 }),
                phimApiService.getCatalogList('tv-shows', { page: 1, limit: 20 }),
                phimApiService.getGenreDetail('hanh-dong', { page: 1, limit: 20 }),
                phimApiService.getGenreDetail('hai-huoc', { page: 1, limit: 20 }),
            ]);

            // Helper function to extract data from settled promises
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getData = (result: PromiseSettledResult<any>) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                }
                console.error('Batch request failed:', result.reason);
                return null;
            };

            // Extract Phim API data (nested structure)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getPhimData = (result: PromiseSettledResult<any>) => {
                if (result.status === 'fulfilled') {
                    const value = result.value;
                    // Handle nested data structure from Phim API
                    if (value?.data?.data) {
                        return value.data.data;
                    }
                    if (value?.data) {
                        return value.data;
                    }
                    return value;
                }
                console.error('Phim batch request failed:', result.reason);
                return null;
            };

            const responseData = {
                // TMDB data
                trending: getData(trending),
                popular: getData(popular),
                topRated: getData(topRated),
                genres: {
                    action: getData(actionMovies),
                    comedy: getData(comedyMovies),
                    horror: getData(horrorMovies),
                    romance: getData(romanceMovies),
                },
                // Phim data
                phim: {
                    phimBo: getPhimData(phimBo),
                    anime: getPhimData(anime),
                    tvShows: getPhimData(tvShows),
                },
                phimGenres: {
                    action: getPhimData(actionTv),
                    comedy: getPhimData(comedyTv),
                },
            };

            // Cache the batch response for 2 minutes
            homeCache.set(cacheKey, responseData, CACHE_TTL.SHORT);

            const duration = Date.now() - startTime;
            console.log(`[HomeController] Batch request completed in ${duration}ms`);

            res.status(200).json({
                success: true,
                data: responseData,
                cached: false,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Home page batch error:', error);
            throw error;
        }
    }
);
