import type { MovieDetails, PhimMovieMeta, Cast } from '@/types';
import { phimTitle, phimOverview, phimLabel } from './phimLocalization.ts';
import { getTranslatedGenre, getTranslatedCountry } from './translations.ts';
export { plainText } from './phimLocalization.ts';

const imageUrl = (path?: string) => !path ? null : /^https?:\/\//i.test(path) ? path : `https://phimimg.com/${path.replace(/^\//, '')}`;

export const phimToMovieDetails = (phim: PhimMovieMeta, movieId: number, language = 'vi'): MovieDetails => ({
  id: movieId, title: phimTitle(phim, language), original_title: phim.origin_name,
  overview: phimOverview(phim, language),
  poster_path: imageUrl(phim.thumb_url || phim.poster_url),
  backdrop_path: imageUrl(phim.poster_url || phim.thumb_url),
  release_date: phim.year ? `${phim.year}-01-01` : '',
  vote_average: phim.tmdb?.vote_average || 0, vote_count: phim.tmdb?.vote_count || 0,
  popularity: 0, adult: false, genre_ids: [], original_language: '', video: false,
  genres: (phim.category || []).map((genre, index) => ({ id: index, name: getTranslatedGenre(genre.name, language) })),
  runtime: Number.parseInt(phim.time || '', 10) || 0,
  status: phimLabel(phim.status, language), tagline: '', budget: 0, revenue: 0, homepage: '', imdb_id: '',
  production_companies: [], spoken_languages: [],
  production_countries: (phim.country || []).map(country => ({ iso_3166_1: '', name: getTranslatedCountry(country.name, language) })),
});

export const phimActorNames = (actors: string[] = []): Cast[] => actors.filter(Boolean).map((name, index) => ({
  id: index, name, character: '', profile_path: null, order: index,
}));

export const selectPhimImages = <T extends { backdrops: unknown[]; posters: unknown[] }>(primary?: T, fallback?: T): T | undefined => {
  if (!primary) return fallback;
  return {
    ...primary,
    backdrops: primary.backdrops?.length ? primary.backdrops : fallback?.backdrops || [],
    posters: primary.posters?.length ? primary.posters : fallback?.posters || [],
  };
};
