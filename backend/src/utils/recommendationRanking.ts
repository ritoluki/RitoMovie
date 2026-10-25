import { asRecord } from './phimPayload';

export const mapConcurrent = async <T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
};

export interface RecommendationMovie {
  slug: string;
  name: string;
  _id?: string;
  origin_name?: string;
  type?: string;
  year?: number;
  content?: string;
  actor?: string[];
  poster_url?: string;
  thumb_url?: string;
  episode_current?: string;
  episode_total?: string;
  quality?: string;
  lang?: string;
  category?: { slug: string }[];
  country?: { slug: string }[];
  tmdb?: { id?: string | number; type?: string; vote_average?: number };
}

export const readMovie = (value: unknown): RecommendationMovie | undefined => {
  const movie = asRecord(value);
  return typeof movie.slug === 'string' && typeof movie.name === 'string'
    ? movie as unknown as RecommendationMovie : undefined;
};

export const mediaTypeOf = (movie: RecommendationMovie): 'movie' | 'tv' => {
  if (movie.tmdb?.type === 'tv' || movie.tmdb?.type === 'movie') return movie.tmdb.type;
  if (['series', 'tvshows'].includes(movie.type) || Number.parseInt(movie.episode_total || '', 10) > 1 ||
      /(?:tập|tap)\s*\d+/iu.test(movie.episode_current || '')) return 'tv';
  return 'movie';
};

export const identityOf = (movie: RecommendationMovie): string =>
  Number(movie.tmdb?.id) > 0 ? `${mediaTypeOf(movie)}:${movie.tmdb.id}` : `slug:${movie.slug}`;

export const hasPlayableEpisodes = (payload: unknown): boolean => {
  const episodes = asRecord(payload).episodes;
  return Array.isArray(episodes) && episodes.some(server => {
    const data = asRecord(server).server_data;
    return Array.isArray(data) && data.some(episode => {
      const source = asRecord(episode);
      return [source.link_m3u8, source.link_embed].some(url => typeof url === 'string' && /^https?:\/\//i.test(url));
    });
  });
};

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').toLowerCase().trim();

const overlap = (left: { slug: string }[] = [], right: { slug: string }[] = []) => {
  const slugs = new Set(left.map(item => item.slug));
  return new Set(right.filter(item => slugs.has(item.slug)).map(item => item.slug)).size;
};

export const rankRecommendation = (source: RecommendationMovie | undefined, candidate: RecommendationMovie,
  tmdbRank?: number, sourceKeywords: string[] = [], candidateKeywords: string[] = []) => {
  const genres = overlap(source?.category, candidate.category);
  const countries = overlap(source?.country, candidate.country);
  const keywords = new Set(sourceKeywords.map(normalize));
  const keywordMatches = new Set(candidateKeywords.map(normalize).filter(word => keywords.has(word))).size;
  const actors = new Set((source?.actor || []).map(normalize));
  const actorMatches = (candidate.actor || []).filter(actor => actors.has(normalize(actor))).length;
  const yearGap = source?.year && candidate.year ? Math.abs(source.year - candidate.year) : undefined;
  const score = (tmdbRank === undefined ? 0 : 50 - Math.min(tmdbRank, 19)) +
    Math.min(genres, 3) * 12 + Math.min(countries, 2) * 4 + Math.min(keywordMatches, 4) * 8 +
    Math.min(actorMatches, 2) * 3 + (yearGap === undefined ? 0 : Math.max(0, 4 - yearGap));
  const reason = keywordMatches ? 'keywords' : tmdbRank !== undefined ? 'similar' : genres ? 'genre' : countries ? 'country' : 'related';
  return { score, reason };
};

export const uniqueCandidates = (movies: RecommendationMovie[], source: RecommendationMovie | undefined, type: 'movie' | 'tv') => {
  const seen = new Set<string>();
  return movies.filter(movie => {
    const identity = identityOf(movie);
    if (mediaTypeOf(movie) !== type || movie.slug === source?.slug ||
        (source && identity === identityOf(source)) || seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
};
