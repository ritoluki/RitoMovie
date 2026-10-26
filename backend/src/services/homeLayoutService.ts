import HomeLayout from '../models/HomeLayout';
import ManagedMovie from '../models/ManagedMovie';
import ApiError from '../utils/ApiError';
import { getHomeSourceData } from './homeDataService';
import { HOME_SECTIONS, SectionSettings, defaultHomeSettings, normalizeHomeSettings, sectionCandidates, homeItemKey } from '../utils/homeSections';
import { MoviePolicy, isMoviePayload, movieIsHidden, decorateMovie } from '../utils/movieManagement';

export async function getHomeLayoutSettings() {
  const doc = await HomeLayout.findById('home').lean();
  return { revision: doc?.revision || 0, sections: normalizeHomeSettings(doc?.sections || []) };
}

export async function saveHomeLayout(expectedRevision: unknown, sections: SectionSettings[]) {
  if (!Number.isSafeInteger(expectedRevision) || Number(expectedRevision) < 0) throw new ApiError(400, 'A valid layout revision is required');
  try {
    const result = await HomeLayout.findOneAndUpdate({ _id: 'home', revision: expectedRevision },
      { $set: { sections }, $inc: { revision: 1 } }, { new: true, upsert: expectedRevision === 0, runValidators: true });
    if (!result) throw new ApiError(409, 'The home layout changed in another session. Reload before editing.');
  } catch (error: any) {
    if (error.code === 11000) throw new ApiError(409, 'The home layout changed in another session. Reload before editing.');
    throw error;
  }
}

export async function homePolicies(data: any, sections: SectionSettings[]): Promise<MoviePolicy[]> {
  const slugs = new Set<string>();
  const ids = new Set<number>();
  const collect = (value: any) => {
    if (Array.isArray(value)) { value.forEach(collect); return; }
    if (!value || typeof value !== 'object') return;
    if (isMoviePayload(value)) {
      if (value.slug) slugs.add(value.slug);
      const id = Number(value.tmdb?.id || value.id);
      if (Number.isSafeInteger(id) && id > 0) ids.add(id);
    } else Object.values(value).forEach(collect);
  };
  collect(data); sections.forEach(section => section.savedItems.forEach(item => collect(item.snapshot)));
  return ManagedMovie.find({ $or: [{ slug: { $in: [...slugs] } }, { tmdbId: { $in: [...ids] } }, { source: 'tmdb', isHidden: true },
    { $or: [{ isFeatured: true }, { isTrending: true }] }] }).sort({ updatedAt: -1, _id: 1 }).lean() as unknown as Promise<MoviePolicy[]>;
}

export function curatedHomeData(policies: MoviePolicy[], language: string, includeHidden = false) {
  const items = (flag: 'isFeatured' | 'isTrending') => ({ items: policies.filter(policy => policy[flag] && policy.snapshot &&
    (includeHidden || (!policy.isHidden && !movieIsHidden(policy.snapshot!, policies, policy.mediaType)))).slice(0, 20)
    .map(policy => decorateMovie(policy.snapshot!, policies, language, policy.mediaType)) });
  return { featured: items('isFeatured'), trending: items('isTrending') };
}

export async function homeEditorContext(language: string) {
  const layout = await getHomeLayoutSettings();
  const source = await getHomeSourceData(language);
  const policies = await homePolicies(source.data, layout.sections);
  return { layout, data: { ...source.data, managed: curatedHomeData(policies, language, true) }, policies };
}

export async function homeEditorView(language: string) {
  const { layout, data, policies } = await homeEditorContext(language);
  return { revision: layout.revision, sections: layout.sections.map(settings => {
    const definition = HOME_SECTIONS.find(section => section.id === settings.id)!;
    const { map, liveIds } = sectionCandidates(data, definition, settings);
    const order = [...new Set([...settings.pinnedIds, ...settings.itemOrder, ...liveIds, ...map.keys()])];
    return { ...definition, ...settings, savedItems: undefined, liveCount: liveIds.length, items: order.filter(key => map.has(key)).map(key => {
      const snapshot = map.get(key)!;
      const type = key.startsWith('tmdb:tv:') || snapshot.tmdb?.type === 'tv' ? 'tv' : 'movie';
      return { key, movie: decorateMovie(snapshot, policies, language, type), hidden: settings.hiddenIds.includes(key),
        pinned: settings.pinnedIds.includes(key), live: liveIds.includes(key), globallyHidden: movieIsHidden(snapshot, policies, type) };
    }) };
  }) };
}

export function normalizedTmdbSnapshot(movie: Record<string, any>) {
  const key = homeItemKey(movie)!;
  const type = key.startsWith('tmdb:tv:') ? 'tv' : 'movie';
  const image = (value: string, size: string) => !value ? '' : /^https?:\/\//.test(value) ? value : `https://image.tmdb.org/t/p/${size}${value}`;
  return {
    ...movie, siteSource: 'tmdb', slug: key, _id: key, name: movie.title || movie.name,
    origin_name: movie.original_title || movie.original_name || movie.title || movie.name,
    content: movie.overview || '', year: Number(String(movie.release_date || movie.first_air_date || '').slice(0, 4)) || undefined,
    type: type === 'tv' ? 'series' : 'single', tmdb: { id: String(movie.id), type },
    thumb_url: image(movie.poster_path, 'w500'), poster_url: image(movie.backdrop_path, 'original'),
    category: [], country: [], actor: [],
  };
}
