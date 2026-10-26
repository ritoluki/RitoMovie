const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HOME_SECTIONS, defaultHomeSettings, normalizeHomeSettings, homeItemKey, materializeHomeSections, sectionCandidates, validateSectionPatch } = require('../dist/utils/homeSections');
const { projectMoviePayload } = require('../dist/utils/movieManagement');
const movie = id => ({ id, title: `Movie ${id}`, poster_path: '/poster.jpg', release_date: '2026-01-01' });
const find = (sections, id) => sections.find(section => section.id === id);

test('prefills every existing section and preserves independent copies of shared sources', () => {
  assert.equal(HOME_SECTIONS.length, 17);
  const data = { trending: { results: [movie(1), movie(2)] }, topRated: { results: [movie(1), movie(2)] }, popular: { results: [movie(1), movie(2)] } };
  const original = structuredClone(data);
  const settings = defaultHomeSettings();
  find(settings, 'top-rated').hiddenIds = ['tmdb:movie:1'];
  find(settings, 'trending').enabled = false;
  const result = materializeHomeSections(data, settings);
  assert.equal(find(result, 'trending'), undefined);
  assert.equal(find(result, 'hero').items.length, 2);
  assert.deepEqual(find(result, 'top-rated').items.map(item => item.id), [2]);
  assert.deepEqual(find(result, 'popular').items.map(item => item.id), [1, 2]);
  assert.deepEqual(data, original);
});

test('pins survive source changes and manual order still admits new live movies', () => {
  const settings = defaultHomeSettings();
  const section = find(settings, 'top-rated');
  section.pinnedIds = ['tmdb:movie:7'];
  section.itemOrder = ['tmdb:movie:2', 'tmdb:movie:1', 'tmdb:movie:8'];
  section.savedItems = [{ key: 'tmdb:movie:7', snapshot: movie(7) }, { key: 'tmdb:movie:8', snapshot: movie(8) }];
  const data = { topRated: { results: [movie(1), movie(2), movie(3)] } };
  assert.deepEqual(find(materializeHomeSections(data, settings), 'top-rated').items.map(item => item.id), [7, 2, 1, 3]);
  section.hiddenIds = ['tmdb:movie:7'];
  assert.deepEqual(find(materializeHomeSections(data, settings), 'top-rated').items.map(item => item.id), [2, 1, 3]);
  section.hiddenIds = []; section.itemOrder = [];
  assert.deepEqual(find(materializeHomeSections(data, settings), 'top-rated').items.map(item => item.id), [7, 1, 2, 3]);
});

test('globally hidden pinned snapshots are filtered and cannot bypass website visibility', () => {
  const settings = defaultHomeSettings();
  const section = find(settings, 'top-rated');
  section.pinnedIds = ['tmdb:movie:7'];
  section.savedItems = [{ key: 'tmdb:movie:7', snapshot: movie(7) }];
  const policy = { source: 'tmdb', slug: 'tmdb:movie:7', tmdbId: 7, mediaType: 'movie', isHidden: true };
  const result = materializeHomeSections({ topRated: { results: [movie(1)] } }, settings, item => projectMoviePayload(item, [policy], 'en', 'movie'));
  assert.deepEqual(find(result, 'top-rated').items.map(item => item.id), [1]);
});

test('typed identities keep TV, movie and individual source seasons separate', () => {
  assert.equal(homeItemKey(movie(42)), 'tmdb:movie:42');
  assert.equal(homeItemKey({ id: 42, name: 'TV', first_air_date: '' }), 'tmdb:tv:42');
  assert.equal(homeItemKey({ slug: 'season-two', tmdb: { id: '42', type: 'tv' } }), 'phim:season-two');
  assert.equal(homeItemKey({ siteSource: 'tmdb', slug: 'tmdb:tv:42', tmdb: { id: '42', type: 'tv' } }), 'tmdb:tv:42');
});

test('only server-known movie references are saved and obsolete snapshots are pruned', () => {
  const settings = find(defaultHomeSettings(), 'top-rated');
  const definition = HOME_SECTIONS.find(section => section.id === 'top-rated');
  const { map } = sectionCandidates({ topRated: { results: [movie(1), movie(2)] } }, definition, settings);
  const patch = validateSectionPatch({ revision: 0, enabled: false, hiddenIds: ['tmdb:movie:1'], pinnedIds: ['tmdb:movie:2'] }, settings, map);
  assert.equal(patch.enabled, false);
  assert.equal(patch.savedItems.length, 2);
  assert.equal(validateSectionPatch({ hiddenIds: [], pinnedIds: [] }, patch, map).savedItems.length, 0);
  for (const body of [{ enabled: 'false' }, { order: 1 }, { savedItems: [] }, { hiddenIds: ['tmdb:movie:999'] },
    { pinnedIds: ['tmdb:movie:1', 'tmdb:movie:1'] }, { itemOrder: 'invalid' }]) assert.throws(() => validateSectionPatch(body, settings, map), { statusCode: 400 });
});

test('new defaults are restored for missing sections without overwriting saved settings', () => {
  const stored = find(defaultHomeSettings(), 'top-rated');
  stored.enabled = false;
  const normalized = normalizeHomeSettings([stored]);
  assert.equal(normalized.length, HOME_SECTIONS.length);
  assert.equal(find(normalized, 'top-rated').enabled, false);
  assert.equal(normalized[0].id, 'hero');
  assert.equal(find(materializeHomeSections({}, normalized), 'top-rated'), undefined);
});
