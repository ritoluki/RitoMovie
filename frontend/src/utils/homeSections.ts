import type { Movie, PhimMovieSummary } from '../types/index.ts';

export interface HomeSection {
  id: string; kind: 'hero' | 'movie' | 'phim' | 'top' | 'tilted'; titleKey: string;
  title: { vi: string; en: string }; link?: string; items: Array<Movie | PhimMovieSummary>;
}

// Compatibility while the frontend and API roll out independently. The API's
// configured homeSections list is authoritative whenever it is present.
export function homeSectionsFrom(data: any): HomeSection[] {
  if (Array.isArray(data.homeSections)) return data.homeSections;
  const definitions: Array<[string, HomeSection['kind'], string, string, string, string?]> = [
    ['hero', 'hero', 'trending.results', 'home.hero', 'Hero banner'],
    ['featured', 'phim', 'managed.featured.items', 'home.managedFeatured', 'Featured on RitoMovie'],
    ['managed-trending', 'phim', 'managed.trending.items', 'home.managedTrending', 'Trending on RitoMovie'],
    ['recent', 'phim', 'updates.items', 'home.recentlyUpdated', 'Recently updated'],
    ['trending', 'top', 'trending.results', 'home.topTVSeries', 'Top 10 TV series'],
    ['popular', 'movie', 'popular.results', 'home.popularMovies', 'Popular movies', '/browse?sort_by=popularity.desc'],
    ['top-rated', 'movie', 'topRated.results', 'home.topRated', 'Top rated', '/browse?sort_by=vote_average.desc'],
    ['action', 'movie', 'genres.action.results', 'home.actionMovies', 'Action movies', '/browse?genre=28'],
    ['top-movies', 'tilted', 'popular.results', 'home.topMovies', 'Top 10 movies'],
    ['comedy', 'movie', 'genres.comedy.results', 'home.comedyMovies', 'Comedy movies', '/browse?genre=35'],
    ['horror', 'movie', 'genres.horror.results', 'home.horrorMovies', 'Horror movies', '/browse?genre=27'],
    ['romance', 'movie', 'genres.romance.results', 'home.romanceMovies', 'Romance movies', '/browse?genre=10749'],
    ['series', 'phim', 'phim.phimBo.items', 'home.popularTvShows', 'Popular TV shows', '/browse?catalog=phim-bo'],
    ['animation', 'phim', 'phim.anime.items', 'home.animeTvShows', 'Animation', '/browse?catalog=hoat-hinh'],
    ['action-series', 'phim', 'phimGenres.action.items', 'home.actionTvShows', 'Action TV shows', '/browse?catalog=phim-bo&phimGenre=hanh-dong'],
    ['tv-shows', 'phim', 'phim.tvShows.items', 'home.tvShowsCategory', 'TV shows', '/browse?catalog=tv-shows'],
    ['comedy-series', 'phim', 'phimGenres.comedy.items', 'home.comedyTvShows', 'Comedy TV shows', '/browse?catalog=phim-bo&phimGenre=hai-huoc'],
  ];
  return definitions.map(([id, kind, path, titleKey, title, link]) => {
    const items = path.split('.').reduce((value, key) => value?.[key], data);
    return { id, kind, titleKey, title: { vi: title, en: title }, link,
      items: Array.isArray(items) ? items.slice(0, kind === 'hero' ? 5 : kind === 'top' || kind === 'tilted' ? 10 : 20) : [] };
  });
}
