import * as tmdb from './tmdbService';
import * as phim from './phimApiService';
import { homeCache, CACHE_TTL } from '../utils/cache';
import { describeExternalApiError } from '../utils/externalApi';

export async function getHomeSourceData(language: string) {
  const cacheKey = `home:batch:${language}`;
  const cached = homeCache.get<Record<string, any>>(cacheKey);
  if (cached) return { data: cached, cached: true };
  const start = Date.now();
  const results = await Promise.allSettled([
    tmdb.getTrendingMovies('week', language), tmdb.getPopularMovies(1, language), tmdb.getTopRatedMovies(1, language),
    ...[28, 35, 27, 10749].map(id => tmdb.getMoviesByGenre(id, 1, language)),
    ...(['phim-bo', 'hoat-hinh', 'tv-shows'] as const).map(type => phim.getCatalogList(type, { page: 1, limit: 20 })),
    phim.getGenreDetail('hanh-dong', { page: 1, limit: 20 }), phim.getGenreDetail('hai-huoc', { page: 1, limit: 20 }),
    phim.getHomeUpdates(1),
  ]);
  const read = (index: number, source = false): any => {
    const result = results[index];
    if (result.status === 'rejected') { console.warn('[HomeData]', describeExternalApiError(result.reason)); return null; }
    return source ? result.value?.data?.data || result.value?.data || result.value : result.value;
  };
  const data = {
    trending: read(0), popular: read(1), topRated: read(2),
    genres: { action: read(3), comedy: read(4), horror: read(5), romance: read(6) },
    phim: { phimBo: read(7, true), anime: read(8, true), tvShows: read(9, true) },
    phimGenres: { action: read(10, true), comedy: read(11, true) }, updates: read(12, true),
  };
  if (results.every(result => result.status === 'fulfilled')) homeCache.set(cacheKey, data, CACHE_TTL.SHORT);
  return { data, cached: false, duration: `${Date.now() - start}ms` };
}
