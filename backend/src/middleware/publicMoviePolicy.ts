import { Request, Response, NextFunction } from 'express';
import ManagedMovie from '../models/ManagedMovie';
import ApiError from '../utils/ApiError';
import { isMoviePayload, MoviePolicy, movieIsHidden, projectMoviePayload, decorateMovie, escapeSearch } from '../utils/movieManagement';
import { getHomeLayoutSettings, curatedHomeData } from '../services/homeLayoutService';
import { materializeHomeSections } from '../utils/homeSections';

const unavailable = () => new ApiError(404, 'This movie is not available on this website.', 'MOVIE_UNAVAILABLE');

export async function applyPublicMoviePolicy(req: Request, payload: any) {
  const path = req.originalUrl.split('?')[0];
  const slugMatch = path.match(/^\/api\/phim\/movie\/([^/]+)(?:\/extras)?$/);
  const requestedSlug = slugMatch ? decodeURIComponent(slugMatch[1])
    : path === '/api/phim/recommendations' && typeof req.query.slug === 'string' ? req.query.slug : undefined;
  const tmdbMatch = path.match(/^\/api\/movies\/(\d+)(?:\/.*)?$/);
  const mediaType = req.query.type === 'tv' ? 'tv' : 'movie';
  const language = (req as { language?: string }).language || 'en';
  const home = path === '/api/home/batch';
  const layout = home ? await getHomeLayoutSettings() : undefined;
  const slugs = new Set<string>(requestedSlug ? [requestedSlug] : []);
  const ids = { movie: new Set<number>(), tv: new Set<number>() };
  if (tmdbMatch) ids[mediaType].add(Number(tmdbMatch[1]));
  const collect = (value: any) => {
    if (Array.isArray(value)) { value.forEach(collect); return; }
    if (!value || typeof value !== 'object') return;
    if (isMoviePayload(value)) {
      if (value.slug) slugs.add(value.slug);
      const id = Number(value.tmdb?.id || value.id);
      const type = value.tmdb?.type === 'tv' || value.media_type === 'tv' || value.first_air_date !== undefined
        ? 'tv' : value.media_type === 'movie' || value.tmdb?.type === 'movie' ? 'movie' : mediaType;
      if (Number.isSafeInteger(id) && id > 0) ids[type].add(id);
    } else Object.values(value).forEach(collect);
  };
  collect(payload);
  layout?.sections.forEach(section => section.savedItems.forEach(item => collect(item.snapshot)));
  const titleSearch = path === '/api/phim/search' && Number(req.query.page || 1) === 1 && typeof req.query.keyword === 'string'
    ? req.query.keyword.trim().slice(0, 200) : '';
  const lookups: Record<string, unknown>[] = [];
  if (slugs.size) lookups.push({ slug: { $in: [...slugs] } });
  for (const type of ['movie', 'tv'] as const) if (ids[type].size) lookups.push({ tmdbId: { $in: [...ids[type]] }, mediaType: type });
  if (home) lookups.push({ isHidden: false, $or: [{ isFeatured: true }, { isTrending: true }] });
  if (titleSearch) lookups.push({ isHidden: false, $or: ['overrides.titles.vi', 'overrides.titles.en']
    .map(field => ({ [field]: { $regex: escapeSearch(titleSearch), $options: 'i' } })) });
  if (!lookups.length) return payload;
  // A curated/search fallback can be outside the current upstream batch. Keep
  // canonical deny rules available even when that movie was not in the raw page.
  lookups.push({ source: 'tmdb', isHidden: true });
  const policies = await ManagedMovie.find({ $or: lookups }).sort({ updatedAt: -1, _id: 1 })
    .select(home || titleSearch ? '-__v' : '-snapshot -__v').lean() as unknown as MoviePolicy[];
  if (requestedSlug && policies.some(policy => policy.slug === requestedSlug && policy.isHidden)) throw unavailable();
  const requestedPolicy = requestedSlug ? policies.find(policy => policy.slug === requestedSlug) : undefined;
  if (requestedPolicy && movieIsHidden({ slug: requestedSlug, tmdb: { id: requestedPolicy.tmdbId, type: requestedPolicy.mediaType } }, policies, mediaType)) throw unavailable();
  if (tmdbMatch && movieIsHidden({ id: Number(tmdbMatch[1]) }, policies, mediaType)) throw unavailable();
  const result = projectMoviePayload(payload, policies, language, mediaType);
  if ((payload.data?.movie && !result.data?.movie) || (isMoviePayload(payload.data || {}) && !result.data)) throw unavailable();
  if (titleSearch) {
    const catalog = Array.isArray(result.data?.data?.items) ? result.data.data : result.data;
    if (Array.isArray(catalog?.items)) {
      const match = new RegExp(escapeSearch(titleSearch), 'i');
      const extra = policies.filter(policy => !policy.isHidden && policy.snapshot && !movieIsHidden(policy.snapshot!, policies, policy.mediaType) &&
        Object.values(policy.overrides?.titles || {}).some(title => match.test(title))).slice(0, 20)
        .map(policy => decorateMovie(policy.snapshot!, [policy], language, policy.mediaType));
      // Keep current upstream metadata when the same slug is already on this page.
      catalog.items = [...new Map([...extra, ...catalog.items].map(movie => [movie.slug, movie])).values()];
      const pagination = catalog.params?.pagination || catalog.pagination;
      if (extra.length && pagination) {
        pagination.totalItems = Math.max(Number(pagination.totalItems) || 0, catalog.items.length);
        pagination.totalPages = Math.max(Number(pagination.totalPages) || 0, 1);
      }
    }
  }
  if (home && result.data) {
    result.data.managed = curatedHomeData(policies, language);
    result.data.homeSections = materializeHomeSections(result.data, layout!.sections,
      movie => projectMoviePayload(movie, policies, language, mediaType));
  }
  return result;
}

// Run AFTER upstream response caches are read. Admin edits therefore take effect
// on fresh API requests immediately without mutating or purging external caches.
export function publicMoviePolicy(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET') return next();
  const json = res.json.bind(res);
  res.json = ((body: any) => {
    res.json = json;
    if (res.statusCode >= 400 || body?.success !== true) return json(body);
    res.setHeader('Cache-Control', 'no-store');
    void applyPublicMoviePolicy(req, body).then(result => { json(result); }).catch(next);
    return res;
  }) as Response['json'];
  next();
}
