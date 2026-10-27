import type { MovieDetails, PhimMovieSummary } from '../types/index.ts';

export const isVietnamese = (language: string) => language.toLowerCase().split(/[-_]/)[0] === 'vi';

export const plainText = (content: string): string => content.replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

type SourceTitle = Pick<PhimMovieSummary, 'name' | 'origin_name' | 'siteOverrides' | 'siteSource'>;
type LocalizedMovie = Partial<Pick<MovieDetails, 'title' | 'name' | 'overview'>>;

export function phimTitle(source: SourceTitle | undefined, language: string, tmdb?: LocalizedMovie): string {
  const override = source?.siteOverrides?.titles?.[isVietnamese(language) ? 'vi' : 'en']?.trim();
  if (override) return override;
  const localized = tmdb?.title?.trim() || tmdb?.name?.trim();
  if (source?.siteSource === 'tmdb') return localized || source.origin_name || source.name || '';
  return isVietnamese(language)
    ? source?.name?.trim() || localized || source?.origin_name?.trim() || ''
    : localized || source?.origin_name?.trim() || source?.name?.trim() || '';
}

export function phimOverview(source: { content?: string; siteOverrides?: PhimMovieSummary['siteOverrides']; siteSource?: 'tmdb' } | undefined, language: string, tmdb?: LocalizedMovie): string {
  const override = source?.siteOverrides?.overviews?.[isVietnamese(language) ? 'vi' : 'en']?.trim();
  if (override) return plainText(override);
  if (tmdb?.overview?.trim()) return plainText(tmdb.overview);
  if (source?.siteSource === 'tmdb') return '';
  // Free-form Vietnamese descriptions cannot be translated reliably without a source.
  return isVietnamese(language) ? plainText(source?.content || '') : '';
}

// Upstream metadata can use numbers for episode fields even on the same endpoint.
// Ignore malformed values instead of passing objects/arrays into string methods.
const metadataText = (value: unknown): string => typeof value === 'string'
  ? value.trim()
  : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

export function phimLabel(input: unknown, language: string): string {
  const value = metadataText(input);
  if (!value) return '';
  const types: Record<string, [string, string]> = {
    single: ['Phim lẻ', 'Movie'], series: ['Phim bộ', 'TV series'],
    hoathinh: ['Hoạt hình', 'Animation'], tvshows: ['Chương trình truyền hình', 'TV show'],
    completed: ['Hoàn tất', 'Completed'], ongoing: ['Đang chiếu', 'Ongoing'],
  };
  if (types[value]) return types[value][isVietnamese(language) ? 0 : 1];
  if (isVietnamese(language)) return value;
  return value
    .replace(/hoàn tất|hoàn thành/gi, 'Completed')
    .replace(/đang cập nhật/gi, 'Updating')
    .replace(/đang chiếu/gi, 'Ongoing')
    .replace(/sắp chiếu/gi, 'Coming soon')
    .replace(/vietsub/gi, 'Vietnamese subtitles')
    .replace(/thuyết minh/gi, 'Vietnamese voice-over')
    .replace(/lồng tiếng/gi, 'Vietnamese dubbing')
    .replace(/\/\s*tập/gi, '/episode')
    .replace(/tập\s*/gi, 'Episode ')
    .replace(/phần\s*/gi, 'Season ')
    .replace(/phút/gi, 'min')
    .replace(/giờ/gi, 'h').trim();
}

export function phimEpisodeName(input: unknown, language: string): string {
  const value = metadataText(input);
  if (!value) return '';
  return /^\d+$/.test(value.trim())
    ? `${isVietnamese(language) ? 'Tập' : 'Episode'} ${value.trim()}`
    : phimLabel(value, language);
}

export function phimEpisodeCount(input: unknown, language: string): string {
  const value = metadataText(input);
  if (!value) return '';
  const count = value.trim().match(/^(\d+)\s*(?:tập|episodes?)?$/i);
  return count ? `${count[1]} ${isVietnamese(language) ? 'Tập' : 'Episodes'}` : phimLabel(value, language);
}
