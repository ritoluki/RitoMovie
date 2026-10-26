import ApiError from './ApiError';

export interface MovieOverrides {
  titles?: { vi?: string; en?: string };
  overviews?: { vi?: string; en?: string };
  posterUrl?: string;
  backdropUrl?: string;
}

export interface MoviePolicy {
  source?: 'phimapi' | 'tmdb';
  slug: string;
  tmdbId?: number;
  mediaType: 'movie' | 'tv';
  isHidden: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  overrides?: MovieOverrides;
  snapshot?: Record<string, any>;
}

export const escapeSearch = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function validateSlug(value: unknown): string {
  if (typeof value !== 'string' || value.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new ApiError(400, 'Enter a valid PhimAPI slug, for example chien-binh-anh-sang-teo');
  }
  return value;
}

export function parseMoviePatch(body: unknown): Partial<Pick<MoviePolicy, 'isHidden' | 'isFeatured' | 'isTrending' | 'overrides'>> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Invalid movie settings');
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some(key => !['isHidden', 'isFeatured', 'isTrending', 'overrides'].includes(key))) {
    throw new ApiError(400, 'Unsupported movie setting');
  }
  const patch: ReturnType<typeof parseMoviePatch> = {};
  for (const key of ['isHidden', 'isFeatured', 'isTrending'] as const) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'boolean') throw new ApiError(400, `${key} must be true or false`);
      patch[key] = input[key] as boolean;
    }
  }
  if (input.overrides !== undefined) {
    const overrides = input.overrides;
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new ApiError(400, 'Invalid overrides');
    const fields = overrides as Record<string, unknown>;
    if (Object.keys(fields).some(key => !['titles', 'overviews', 'posterUrl', 'backdropUrl'].includes(key))) throw new ApiError(400, 'Unsupported override');
    patch.overrides = {};
    for (const key of ['titles', 'overviews'] as const) {
      if (fields[key] === undefined) continue;
      const locales = fields[key];
      if (!locales || typeof locales !== 'object' || Array.isArray(locales)) throw new ApiError(400, `Invalid ${key}`);
      patch.overrides[key] = {};
      for (const [language, value] of Object.entries(locales)) {
        if (!['vi', 'en'].includes(language) || typeof value !== 'string' || value.length > (key === 'titles' ? 200 : 10000)) {
          throw new ApiError(400, `Invalid ${key} translation`);
        }
        patch.overrides[key]![language as 'vi' | 'en'] = value.trim();
      }
    }
    for (const key of ['posterUrl', 'backdropUrl'] as const) {
      if (fields[key] === undefined) continue;
      const value = fields[key];
      if (typeof value !== 'string' || value.length > 2000) throw new ApiError(400, `Invalid ${key}`);
      const trimmed = value.trim();
      if (trimmed) {
        try {
          const url = new URL(trimmed);
          if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid URL');
        } catch { throw new ApiError(400, `${key} must be an http(s) image URL`); }
      }
      patch.overrides[key] = trimmed;
    }
  }
  if (!Object.keys(patch).length) throw new ApiError(400, 'No movie settings provided');
  return patch;
}

export const bulkMovieActions = {
  hide: { isHidden: true }, show: { isHidden: false },
  feature: { isFeatured: true }, unfeature: { isFeatured: false },
  trending: { isTrending: true }, untrending: { isTrending: false },
} as const;

export function matchingPolicies(movie: Record<string, any>, policies: MoviePolicy[], mediaType: 'movie' | 'tv'): MoviePolicy[] {
  // A slug identifies a season. Never apply a different season's overrides by TMDB ID.
  if (typeof movie.slug === 'string' && movie.siteSource !== 'tmdb') {
    const id = Number(movie.tmdb?.id);
    const type = movie.tmdb?.type === 'tv' ? 'tv' : 'movie';
    return policies.filter(policy => policy.slug === movie.slug || (policy.source === 'tmdb' && policy.tmdbId === id && policy.mediaType === type));
  }
  const id = Number(movie.tmdb?.id || movie.id);
  const type = movie.tmdb?.type === 'tv' || movie.media_type === 'tv' || movie.first_air_date !== undefined ? 'tv' : movie.media_type === 'movie' ? 'movie' : mediaType;
  return policies.filter(policy => policy.tmdbId === id && policy.mediaType === type);
}

export function movieIsHidden(movie: Record<string, any>, policies: MoviePolicy[], mediaType: 'movie' | 'tv'): boolean {
  const matches = matchingPolicies(movie, policies, mediaType);
  if (matches.some(policy => policy.source === 'tmdb' && policy.isHidden)) return true;
  const sourcePolicies = matches.filter(policy => policy.source !== 'tmdb');
  return sourcePolicies.length > 0 && sourcePolicies.every(policy => policy.isHidden);
}

export function decorateMovie(movie: Record<string, any>, policies: MoviePolicy[], language: string, mediaType: 'movie' | 'tv') {
  let matches = matchingPolicies(movie, policies, mediaType).filter(policy => !policy.isHidden);
  const exact = matches.filter(policy => policy.slug === movie.slug);
  if (exact.length) matches = exact;
  else if (matches.some(policy => policy.source === 'tmdb')) matches = matches.filter(policy => policy.source === 'tmdb');
  // Multiple seasons may share a TMDB ID; do not choose one season's metadata arbitrarily.
  if (matches.length !== 1) return { ...movie };
  const overrides = matches[0].overrides || {};
  const locale = language.startsWith('vi') ? 'vi' : 'en';
  const result: Record<string, any> = { ...movie, siteOverrides: overrides };
  if (movie.slug) {
    if (overrides.posterUrl) result.thumb_url = overrides.posterUrl;
    if (overrides.backdropUrl) result.poster_url = overrides.backdropUrl;
  } else {
    if (overrides.titles?.[locale]) { result.title = overrides.titles[locale]; if ('name' in movie) result.name = overrides.titles[locale]; }
    if (overrides.overviews?.[locale]) result.overview = overrides.overviews[locale];
    if (overrides.posterUrl) result.poster_path = overrides.posterUrl;
    if (overrides.backdropUrl) result.backdrop_path = overrides.backdropUrl;
  }
  return result;
}

export function isMoviePayload(value: Record<string, any>): boolean {
  return (typeof value.slug === 'string' && typeof value.name === 'string' &&
      ['year', 'thumb_url', 'poster_url', 'tmdb', 'episode_current'].some(key => key in value)) ||
    (Number.isSafeInteger(value.id) && (typeof value.title === 'string' || typeof value.name === 'string') &&
      ['poster_path', 'backdrop_path', 'release_date', 'first_air_date', 'media_type', 'overview'].some(key => key in value));
}

// Always project a copy: upstream caches remain raw and can be reused after an admin edit.
export function projectMoviePayload(value: any, policies: MoviePolicy[], language: string, mediaType: 'movie' | 'tv'): any {
  if (Array.isArray(value)) return value.map(item => projectMoviePayload(item, policies, language, mediaType)).filter(item => item !== undefined);
  if (!value || typeof value !== 'object') return value;
  if (isMoviePayload(value)) {
    return movieIsHidden(value, policies, mediaType) ? undefined : decorateMovie(value, policies, language, mediaType);
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, projectMoviePayload(child, policies, language, mediaType)]));
}
