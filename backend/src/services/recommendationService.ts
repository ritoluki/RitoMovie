import { apiCache, CACHE_TTL } from '../utils/cache';
import axios from 'axios';
import ApiError from '../utils/ApiError';
import { asRecord, unwrapPhimData, normalizePhimExtras } from '../utils/phimPayload';
import { describeExternalApiError } from '../utils/externalApi';
import { getRecommendationResource } from './phimApiService';
import { getMovieRecommendations, getTvRecommendations } from './tmdbService';
import { RecommendationMovie, readMovie, identityOf, hasPlayableEpisodes, uniqueCandidates, rankRecommendation, mapConcurrent } from '../utils/recommendationRanking';

interface Options { slug?: string; tmdbId?: number; type: 'movie' | 'tv'; language: string }

const buildRecommendations = async (options: Options) => {
  const cacheKey = `recommendations:${JSON.stringify(options)}`;
  const cached = apiCache.get<{ items: unknown[]; partial: boolean }>(cacheKey);
  if (cached) return cached;

  // A bad upstream must not leave this tab waiting through repeated 15-second timeouts.
  const signal = AbortSignal.timeout(12000);
  let partial = false;
  const request = async (path: string): Promise<unknown> => {
    if (signal.aborted) { partial = true; return undefined; }
    try { return await getRecommendationResource(path, signal); }
    catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return undefined;
      partial = true;
      console.warn(`[Recommendations] ${describeExternalApiError(error)}`);
      return undefined;
    }
  };
  const detail = (payload: unknown) => readMovie(asRecord(payload).movie);
  const sourcePath = options.slug ? `/phim/${encodeURIComponent(options.slug)}` : `/tmdb/${options.type}/${options.tmdbId}`;
  const [sourcePayload, tmdbPayload] = await Promise.all([
    request(sourcePath),
    options.tmdbId ? (options.type === 'tv' ? getTvRecommendations : getMovieRecommendations)(
      options.tmdbId, 1, options.language, AbortSignal.timeout(2500)
    ).catch(error => {
      partial = true;
      console.warn(`[Recommendations] ${describeExternalApiError(error)}`);
      return undefined;
    }) : Promise.resolve(undefined),
  ]);
  const source = detail(sourcePayload);
  const excludedSource = source || (options.tmdbId ? {
    slug: options.slug || '', name: '', tmdb: { id: options.tmdbId, type: options.type },
  } : undefined);
  const tmdbResults = asRecord(tmdbPayload).results;
  const tmdbMovies = Array.isArray(tmdbResults) ? tmdbResults.map(asRecord) : [];
  const tmdbRanks = new Map(tmdbMovies.map((movie, index) => [`${options.type}:${movie.id}`, index]));
  const verified = new Map<string, RecommendationMovie>();
  const keywordPath = (slug: string) => `/v1/api/phim/${encodeURIComponent(slug)}/keywords`;
  const keywordsFrom = (payload: unknown): string[] => payload ? normalizePhimExtras({}, {}, payload).keywords : [];

  const catalogPaths = (source?.category || []).slice(0, 2).map(genre =>
    `/v1/api/the-loai/${encodeURIComponent(genre.slug)}?limit=20&page=1`);
  if (source?.country?.[0]?.slug) catalogPaths.push(
    `/v1/api/quoc-gia/${encodeURIComponent(source.country[0].slug)}?limit=20&page=1`);

  const [catalogPayloads, mapped, sourceKeywordsPayload] = await Promise.all([
    Promise.all(catalogPaths.map(request)),
    mapConcurrent(tmdbMovies.slice(0, 4), 3, async movie => {
      if (!Number.isInteger(Number(movie.id)) || Number(movie.id) <= 0) return undefined;
      const payload = await request(`/tmdb/${options.type}/${movie.id}`);
      const candidate = detail(payload);
      if (candidate && hasPlayableEpisodes(payload)) verified.set(candidate.slug, candidate);
      return candidate;
    }),
    source ? request(keywordPath(source.slug)) : Promise.resolve(undefined),
  ]);
  if (!source && !tmdbMovies.length && partial) throw new ApiError(503, 'Recommendations temporarily unavailable');
  const sourceKeywords = keywordsFrom(sourceKeywordsPayload);
  const catalogMovies = catalogPayloads.flatMap(payload => {
    if (!payload) return [];
    const items = unwrapPhimData(payload).items;
    return Array.isArray(items) ? items.map(readMovie).filter(Boolean) as RecommendationMovie[] : [];
  });
  const candidates = uniqueCandidates([
    ...mapped.filter(Boolean) as RecommendationMovie[], ...catalogMovies,
  ], excludedSource, options.type).sort((left, right) =>
    rankRecommendation(source, right, tmdbRanks.get(identityOf(right))).score -
    rankRecommendation(source, left, tmdbRanks.get(identityOf(left))).score
  ).slice(0, 16);

  const playable = (await mapConcurrent(candidates, 3, async candidate => {
    if (verified.has(candidate.slug)) return verified.get(candidate.slug);
    const payload = await request(`/phim/${encodeURIComponent(candidate.slug)}`);
    return hasPlayableEpisodes(payload) ? detail(payload) : undefined;
  })).filter(Boolean) as RecommendationMovie[];

  // Fetch keywords only for a small shortlist, rather than for every catalog entry.
  const keywords = new Map<string, string[]>();
  await mapConcurrent(playable.slice(0, 8), 3, async movie => {
    if (!sourceKeywords.length) return;
    keywords.set(movie.slug, keywordsFrom(await request(keywordPath(movie.slug))));
  });
  const items = uniqueCandidates(playable, excludedSource, options.type).map(movie => {
    const ranking = rankRecommendation(source, movie, tmdbRanks.get(identityOf(movie)), sourceKeywords, keywords.get(movie.slug));
    // Country alone is too weak when genre information is available; avoid unrelated filler.
    if (source?.category?.length && (ranking.reason === 'country' || ranking.reason === 'related')) return undefined;
    const { content, actor, ...summary } = movie;
    return { ...summary, reason: ranking.reason, score: ranking.score, available: true };
  }).filter(Boolean).sort((left, right) => right.score - left.score || left.slug.localeCompare(right.slug)).slice(0, 12)
    .map(({ score, ...item }) => item);
  const result = { items, partial };
  // Partial results expire quickly so temporary failures can recover.
  apiCache.set(cacheKey, result, partial ? 15000 : CACHE_TTL.MEDIUM);
  return result;
};

const pending = new Map<string, ReturnType<typeof buildRecommendations>>();
export const getPlayableRecommendations = async (options: Options) => {
  const key = JSON.stringify(options);
  const existing = pending.get(key);
  if (existing) return existing;
  const task = buildRecommendations(options);
  pending.set(key, task);
  try { return await task; }
  finally { pending.delete(key); }
};
