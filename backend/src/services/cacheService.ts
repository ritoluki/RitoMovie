/**
 * Cache Warming Service
 * Pre-loads frequently accessed data into cache to improve first-request performance
 */

import * as tmdbService from './tmdbService';
import * as phimApiService from './phimApiService';
import { apiCache, homeCache } from '../utils/cache';

interface WarmupResult {
    success: boolean;
    duration: number;
    errors: string[];
    warmedKeys: number;
}

/**
 * Warm up cache for home page data
 * Call this on server startup or via admin endpoint
 */
export const warmHomeCache = async (languages: string[] = ['en', 'vi']): Promise<WarmupResult> => {
    const startTime = Date.now();
    const errors: string[] = [];
    let warmedKeys = 0;

    console.log('[CacheWarming] Starting home cache warm-up...');

    for (const language of languages) {
        try {
            // Warm TMDB caches
            const tmdbPromises = [
                tmdbService.getTrendingMovies('week', language),
                tmdbService.getPopularMovies(1, language),
                tmdbService.getTopRatedMovies(1, language),
                tmdbService.getMoviesByGenre(28, 1, language), // Action
                tmdbService.getMoviesByGenre(35, 1, language), // Comedy
                tmdbService.getMoviesByGenre(27, 1, language), // Horror
                tmdbService.getMoviesByGenre(10749, 1, language), // Romance
                tmdbService.getGenres(language),
            ];

            // Warm PhimAPI caches
            const phimPromises = [
                phimApiService.getCatalogList('phim-bo', { page: 1, limit: 20 }),
                phimApiService.getCatalogList('hoat-hinh', { page: 1, limit: 20 }),
                phimApiService.getCatalogList('tv-shows', { page: 1, limit: 20 }),
                phimApiService.getGenreDetail('hanh-dong', { page: 1, limit: 20 }),
                phimApiService.getGenreDetail('hai-huoc', { page: 1, limit: 20 }),
                phimApiService.getGenres(),
                phimApiService.getCountries(),
            ];

            const results = await Promise.allSettled([...tmdbPromises, ...phimPromises]);

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    warmedKeys++;
                } else {
                    errors.push(result.reason?.message || 'Unknown error');
                }
            }

            console.log(`[CacheWarming] Warmed ${language} cache`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Failed to warm ${language} cache: ${errorMessage}`);
            console.error(`[CacheWarming] Error warming ${language}:`, error);
        }
    }

    const duration = Date.now() - startTime;
    console.log(`[CacheWarming] Completed in ${duration}ms. Warmed ${warmedKeys} keys.`);

    return {
        success: errors.length === 0,
        duration,
        errors,
        warmedKeys,
    };
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
    const apiStats = apiCache.getStats();
    const homeStats = homeCache.getStats();
    const phimStats = phimApiService.getCacheStats();

    return {
        apiCache: {
            ...apiStats,
            hitRatio: apiCache.getHitRatio(),
        },
        homeCache: {
            ...homeStats,
            hitRatio: homeCache.getHitRatio(),
        },
        phimFailedRequestCache: phimStats,
    };
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
    apiCache.clear();
    homeCache.clear();
    console.log('[CacheWarming] All caches cleared');
};

/**
 * Clear caches by pattern
 */
export const clearCachePattern = (pattern: string) => {
    const apiDeleted = apiCache.deletePattern(pattern);
    const homeDeleted = homeCache.deletePattern(pattern);
    console.log(`[CacheWarming] Cleared ${apiDeleted + homeDeleted} keys matching pattern: ${pattern}`);
    return apiDeleted + homeDeleted;
};

export default {
    warmHomeCache,
    getCacheStats,
    clearAllCaches,
    clearCachePattern,
};
