import ApiError from './ApiError';

export type SectionKind = 'hero' | 'movie' | 'phim' | 'top' | 'tilted';
export interface SectionDefinition {
  id: string; kind: SectionKind; path: string; titleKey: string;
  title: { vi: string; en: string }; link?: string; limit: number;
}
const section = (id: string, kind: SectionKind, path: string, titleKey: string, vi: string, en: string, link?: string, limit = 20): SectionDefinition =>
  ({ id, kind, path, titleKey, title: { vi, en }, link, limit });

export const HOME_SECTIONS: SectionDefinition[] = [
  section('hero', 'hero', 'trending.results', 'home.hero', 'Banner đầu trang', 'Hero banner', undefined, 5),
  section('featured', 'phim', 'managed.featured.items', 'home.managedFeatured', 'Phim nổi bật trên RitoMovie', 'Featured on RitoMovie'),
  section('managed-trending', 'phim', 'managed.trending.items', 'home.managedTrending', 'Xu hướng trên RitoMovie', 'Trending on RitoMovie'),
  section('recent', 'phim', 'updates.items', 'home.recentlyUpdated', 'Mới cập nhật', 'Recently updated'),
  section('trending', 'top', 'trending.results', 'home.topTVSeries', 'Top 10 phim bộ', 'Top 10 TV series', undefined, 10),
  section('popular', 'movie', 'popular.results', 'home.popularMovies', 'Phim phổ biến', 'Popular movies', '/browse?sort_by=popularity.desc'),
  section('top-rated', 'movie', 'topRated.results', 'home.topRated', 'Đánh giá cao', 'Top rated', '/browse?sort_by=vote_average.desc'),
  section('action', 'movie', 'genres.action.results', 'home.actionMovies', 'Phim hành động', 'Action movies', '/browse?genre=28'),
  section('top-movies', 'tilted', 'popular.results', 'home.topMovies', 'Top 10 phim lẻ', 'Top 10 movies', undefined, 10),
  section('comedy', 'movie', 'genres.comedy.results', 'home.comedyMovies', 'Phim hài', 'Comedy movies', '/browse?genre=35'),
  section('horror', 'movie', 'genres.horror.results', 'home.horrorMovies', 'Phim kinh dị', 'Horror movies', '/browse?genre=27'),
  section('romance', 'movie', 'genres.romance.results', 'home.romanceMovies', 'Phim tình cảm', 'Romance movies', '/browse?genre=10749'),
  section('series', 'phim', 'phim.phimBo.items', 'home.popularTvShows', 'Phim bộ phổ biến', 'Popular TV shows', '/browse?catalog=phim-bo'),
  section('animation', 'phim', 'phim.anime.items', 'home.animeTvShows', 'Hoạt hình', 'Animation', '/browse?catalog=hoat-hinh'),
  section('action-series', 'phim', 'phimGenres.action.items', 'home.actionTvShows', 'Phim bộ hành động', 'Action TV shows', '/browse?catalog=phim-bo&phimGenre=hanh-dong'),
  section('tv-shows', 'phim', 'phim.tvShows.items', 'home.tvShowsCategory', 'Chương trình truyền hình', 'TV shows', '/browse?catalog=tv-shows'),
  section('comedy-series', 'phim', 'phimGenres.comedy.items', 'home.comedyTvShows', 'Phim bộ hài', 'Comedy TV shows', '/browse?catalog=phim-bo&phimGenre=hai-huoc'),
];

export interface SectionSettings {
  id: string; enabled: boolean; order: number; hiddenIds: string[]; pinnedIds: string[]; itemOrder: string[];
  savedItems: Array<{ key: string; snapshot: Record<string, any> }>;
}
export const defaultHomeSettings = (): SectionSettings[] => HOME_SECTIONS.map((definition, order) =>
  ({ id: definition.id, enabled: true, order, hiddenIds: [], pinnedIds: [], itemOrder: [], savedItems: [] }));

export function normalizeHomeSettings(stored: SectionSettings[] = []): SectionSettings[] {
  return defaultHomeSettings().map(fallback => {
    const existing = stored.find(entry => entry.id === fallback.id);
    return existing ? { ...fallback, ...existing, id: fallback.id } : fallback;
  }).sort((left, right) => left.id === 'hero' ? -1 : right.id === 'hero' ? 1 : left.order - right.order);
}

export function homeItemKey(movie: Record<string, any>): string | undefined {
  if (typeof movie.slug === 'string' && movie.slug && movie.siteSource !== 'tmdb') return `phim:${movie.slug}`;
  const id = Number(movie.tmdb?.id || movie.id);
  const type = movie.tmdb?.type === 'tv' || movie.media_type === 'tv' || movie.first_air_date !== undefined ? 'tv' : 'movie';
  return Number.isSafeInteger(id) && id > 0 ? `tmdb:${type}:${id}` : undefined;
}
export function sourceSectionItems(data: any, definition: SectionDefinition): Record<string, any>[] {
  const items = definition.path.split('.').reduce((value, key) => value?.[key], data);
  return Array.isArray(items) ? items.filter(item => item && typeof item === 'object' && homeItemKey(item)) : [];
}

export function sectionCandidates(data: any, definition: SectionDefinition, settings: SectionSettings) {
  const live = sourceSectionItems(data, definition);
  const map = new Map(settings.savedItems.map(item => [item.key, item.snapshot]));
  live.forEach(movie => map.set(homeItemKey(movie)!, movie));
  return { map, liveIds: live.map(movie => homeItemKey(movie)!) };
}

// Pins survive source rotations. Manual order applies to current results; new source
// items continue to arrive behind the explicitly ordered entries.
export function materializeHomeSections(data: any, stored: SectionSettings[], project: (movie: Record<string, any>) => any = movie => ({ ...movie })) {
  return normalizeHomeSettings(stored).filter(settings => settings.enabled).map(settings => {
    const definition = HOME_SECTIONS.find(section => section.id === settings.id)!;
    const { map, liveIds } = sectionCandidates(data, definition, settings);
    const keys = [...new Set([...settings.pinnedIds, ...settings.itemOrder.filter(key => liveIds.includes(key)), ...liveIds])];
    const items = keys.filter(key => !settings.hiddenIds.includes(key)).map(key => map.get(key))
      .filter(Boolean).map(movie => project(movie!)).filter(Boolean).slice(0, definition.limit);
    return { id: definition.id, kind: definition.kind, titleKey: definition.titleKey, title: definition.title, link: definition.link, items };
  });
}

export function validateSectionPatch(body: any, current: SectionSettings, candidates: Map<string, Record<string, any>>): SectionSettings {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['revision', 'enabled', 'hiddenIds', 'pinnedIds', 'itemOrder'].includes(key))) {
    throw new ApiError(400, 'Invalid section settings');
  }
  const next = { ...current };
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') throw new ApiError(400, 'enabled must be true or false');
    next.enabled = body.enabled;
  }
  for (const field of ['hiddenIds', 'pinnedIds', 'itemOrder'] as const) {
    if (body[field] === undefined) continue;
    const keys = body[field];
    if (!Array.isArray(keys) || keys.length > 200 || keys.some(key => typeof key !== 'string' || key.length > 240 || !candidates.has(key)) || new Set(keys).size !== keys.length) {
      throw new ApiError(400, `Invalid ${field}; reload this section before editing`);
    }
    next[field] = keys;
  }
  const referenced = [...new Set([...next.hiddenIds, ...next.pinnedIds, ...next.itemOrder])];
  if (referenced.length > 200) throw new ApiError(400, 'A section can store at most 200 configured movies. Reset unused settings first.');
  next.savedItems = referenced.map(key => ({ key, snapshot: candidates.get(key)! })).filter(item => item.snapshot);
  return next;
}
