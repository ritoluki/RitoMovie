const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateSlug, parseMoviePatch, escapeSearch, movieIsHidden, decorateMovie, projectMoviePayload, isMoviePayload } = require('../dist/utils/movieManagement');

const movie = { slug: 'season-one', name: 'Tên gốc', origin_name: 'Original', year: 2026, tmdb: { id: '42', type: 'tv' }, thumb_url: 'original.jpg' };
const policy = { slug: 'season-one', tmdbId: 42, mediaType: 'tv', isHidden: true, isFeatured: true, isTrending: false, overrides: {} };

test('canonical TMDB visibility covers sources while a visible canonical rule never bypasses a hidden season', () => {
  const canonical = { ...policy, source: 'tmdb', slug: 'tmdb:tv:42', isHidden: true };
  assert.equal(movieIsHidden({ ...movie, slug: 'unmanaged-season' }, [canonical], 'tv'), true);
  assert.equal(movieIsHidden(movie, [{ ...canonical, isHidden: false }, policy], 'tv'), true);
  assert.equal(movieIsHidden({ id: 42 }, [{ ...canonical, isHidden: false }, policy], 'tv'), true);
  assert.equal(movieIsHidden({ id: 42 }, [{ ...canonical, isHidden: false }], 'tv'), false);
});

test('filters every public envelope without changing cached source data or taxonomies', () => {
  const raw = { success: true, data: { phim: { catalog: { items: [movie] } }, trending: { results: [{ id: 42, name: 'Series', first_air_date: '2026-01-01' }] },
    genres: [{ slug: 'season-one', name: 'Keep this taxonomy' }] } };
  const before = structuredClone(raw);
  const result = projectMoviePayload(raw, [policy], 'en', 'movie');
  assert.deepEqual(result.data.phim.catalog.items, []);
  assert.deepEqual(result.data.trending.results, []);
  assert.equal(result.data.genres.length, 1);
  assert.deepEqual(raw, before);
  assert.equal(projectMoviePayload(raw, [{ ...policy, isHidden: false }], 'en', 'movie').data.phim.catalog.items.length, 1);
});

test('keeps movie and TV identifiers distinct and respects individual seasons', () => {
  assert.equal(movieIsHidden({ id: 42 }, [policy], 'movie'), false);
  assert.equal(movieIsHidden({ id: 42 }, [policy], 'tv'), true);
  const seasonTwo = { ...policy, slug: 'season-two', isHidden: false };
  assert.equal(movieIsHidden({ id: 42 }, [policy, seasonTwo], 'tv'), false);
  assert.equal(movieIsHidden(movie, [policy, seasonTwo], 'tv'), true);
  assert.equal(movieIsHidden({ ...movie, slug: 'unmanaged-season' }, [policy], 'tv'), false);
});

test('applies localized overrides and absolute images to a copy of TMDB metadata', () => {
  const settings = { ...policy, isHidden: false, overrides: { titles: { vi: 'Tên mới', en: 'Edited title' }, overviews: { en: 'Edited synopsis' }, posterUrl: 'https://images.example/poster.jpg' } };
  const raw = { id: 42, name: 'Original series', first_air_date: '', overview: 'Original synopsis' };
  const result = decorateMovie(raw, [settings], 'en-US', 'tv');
  assert.equal(result.title, 'Edited title');
  assert.equal(result.name, 'Edited title');
  assert.equal(result.overview, 'Edited synopsis');
  assert.equal(result.poster_path, 'https://images.example/poster.jpg');
  assert.equal(raw.name, 'Original series');
  assert.equal(decorateMovie(raw, [settings], 'vi', 'tv').overview, 'Original synopsis');
  assert.equal(decorateMovie(raw, [settings, { ...settings, slug: 'season-two' }], 'en', 'tv').name, 'Original series');
});

test('PhimAPI projection keeps canonical identifiers and passes site overrides to clients', () => {
  const settings = { ...policy, isHidden: false, overrides: { titles: { en: 'English title' }, posterUrl: 'https://images.example/new.jpg' } };
  const result = decorateMovie(movie, [settings], 'en', 'tv');
  assert.equal(result.slug, movie.slug);
  assert.equal(result.name, movie.name);
  assert.equal(result.thumb_url, settings.overrides.posterUrl);
  assert.equal(result.siteOverrides.titles.en, 'English title');
  assert.equal(movie.thumb_url, 'original.jpg');
  assert.equal(isMoviePayload({ slug: 'comedy', name: 'Comedy' }), false);
});

test('validates every editable field before database updates', () => {
  assert.deepEqual(parseMoviePatch({ isHidden: false, overrides: { titles: { en: '  New title  ' }, posterUrl: '' } }),
    { isHidden: false, overrides: { titles: { en: 'New title' }, posterUrl: '' } });
  for (const input of [{ isHidden: 'false' }, { snapshot: {} }, { slug: 'changed' }, {},
    { overrides: { posterUrl: 'javascript:alert(1)' } }, { overrides: { posterUrl: 'https://user:pass@example.com/image.jpg' } },
    { overrides: { titles: { fr: 'Not supported' } } }, { overrides: { titles: { en: 'x'.repeat(201) } } }]) {
    assert.throws(() => parseMoviePatch(input), { statusCode: 400 });
  }
});

test('slugs cannot become URLs or traversal paths and searches are literal', () => {
  assert.equal(validateSlug('valid-season-2'), 'valid-season-2');
  for (const slug of ['', '../secret', 'https://example.com', 'x/y', 'a%2fb', 'x'.repeat(201)]) assert.throws(() => validateSlug(slug), { statusCode: 400 });
  assert.equal(new RegExp(escapeSearch('[.*]')).test('[.*]'), true);
  assert.equal(new RegExp(escapeSearch('[.*]')).test('anything'), false);
});
