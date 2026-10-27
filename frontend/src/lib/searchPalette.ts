import type { Movie, PhimMovieSummary } from '../types/index.ts';
import { phimTitle, phimLabel } from '../utils/phimLocalization.ts';

export const SEARCH_HISTORY_KEY = 'ritomovie-search-history';
export const normalizeKeyword = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, 120);
const historyIdentity = (value: string) => normalizeKeyword(value).toLocaleLowerCase();

export function cleanSearchHistory(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input.filter((entry): entry is string => typeof entry === 'string')
    .map(normalizeKeyword).filter(entry => {
      const key = historyIdentity(entry);
      if (entry.length < 2 || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);
}
export function rememberSearch(history: string[], keyword: string) {
  return cleanSearchHistory([keyword, ...history]);
}
export const searchResultsPath = (keyword: string) => `/browse?q=${encodeURIComponent(normalizeKeyword(keyword))}`;

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  type: 'movie' | 'tv';
  label: string;
  poster: string | null;
  source: 'phim' | 'tmdb';
  href: string;
}

export function buildSearchSuggestions(phim: PhimMovieSummary[], movies: Movie[], language: string): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const sourceKeys = new Set<string>();
  const canonical = new Set<string>();
  for (const item of phim) {
    const slug = item.slug || item._id;
    if (!slug || sourceKeys.has(slug)) continue;
    const title = phimTitle(item, language);
    if (!title) continue;
    sourceKeys.add(slug);
    const id = Number(item.tmdb?.id);
    const hasId = Number.isSafeInteger(id) && id > 0;
    const type = item.tmdb?.type === 'tv' ? 'tv' : item.tmdb?.type === 'movie' ? 'movie'
      : item.type === 'series' || item.type === 'tvshows' ? 'tv' : 'movie';
    if (hasId) canonical.add(`${type}:${id}`);
    suggestions.push({ id: `phim:${slug}`, title, subtitle: title === item.name ? item.origin_name : item.name,
      year: item.year ? String(item.year) : '', type, label: phimLabel(item.episode_current || item.quality, language),
      poster: item.poster_url || item.thumb_url || null, source: 'phim',
      href: `/movie/${hasId ? id : 0}?type=${type}${item.siteSource === 'tmdb' ? '' : `&phimSlug=${encodeURIComponent(slug)}`}` });
  }
  // Prefer the site's streaming entries; supplement with distinct TMDB titles.
  for (const movie of movies) {
    if (movie.media_type && !['movie', 'tv'].includes(movie.media_type)) continue;
    if (!Number.isSafeInteger(movie.id) || movie.id <= 0) continue;
    const type = movie.media_type === 'tv' ? 'tv' : 'movie';
    const key = `${type}:${movie.id}`;
    const title = movie.title || movie.name;
    if (!title || canonical.has(key)) continue;
    canonical.add(key);
    suggestions.push({ id: `tmdb:${key}`, title, subtitle: movie.original_title || movie.original_name || '',
      year: (movie.release_date || movie.first_air_date || '').slice(0, 4), type, label: '',
      poster: movie.poster_path, source: 'tmdb', href: `/movie/${movie.id}?type=${type}` });
  }
  return suggestions.slice(0, 8);
}
