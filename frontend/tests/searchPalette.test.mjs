import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchSuggestions, cleanSearchHistory, rememberSearch, searchResultsPath } from '../src/lib/searchPalette.ts';

test('history records committed searches, normalizes whitespace, deduplicates and caps at ten', () => {
  assert.deepEqual(cleanSearchHistory([null, {}, 1, ' ', 'a', ' Dune ', 'dune', '  Arrival  movie ']), ['Dune', 'Arrival movie']);
  assert.deepEqual(rememberSearch(['Dune', 'Arrival'], ' arrival '), ['arrival', 'Dune']);
  assert.equal(cleanSearchHistory(Array.from({ length: 15 }, (_, i) => `Movie ${i}`)).length, 10);
  assert.deepEqual(cleanSearchHistory('invalid'), []);
  assert.equal(searchResultsPath(' a & b /?# '), '/browse?q=a%20%26%20b%20%2F%3F%23');
  assert.equal(cleanSearchHistory(['x'.repeat(500)])[0].length, 120);
  assert.deepEqual(cleanSearchHistory(['Café', 'Cafe\u0301']), ['Café']);
});
const phim = { _id: '1', slug: 'dune', name: 'Tên tiếng Việt', origin_name: 'Dune', year: 2026, tmdb: { id: '42', type: 'movie' }, episode_current: 'Hoàn Tất', poster_url: '/poster.jpg' };
const movie = { id: 42, title: 'Dune', media_type: 'movie', poster_path: '/poster.jpg' };
test('suggestions prefer streaming sources, deduplicate canonical titles and retain separate seasons and media types', () => {
  const result = buildSearchSuggestions([phim, phim, { ...phim, slug: 'season-2' }], [movie, { ...movie, media_type: 'tv', name: 'TV Dune' }, { ...movie, id: 99 }], 'en');
  assert.equal(result.length, 4);
  assert.equal(result[0].source, 'phim');
  assert.equal(result[0].title, 'Dune');
  assert.equal(result[0].href, '/movie/42?type=movie&phimSlug=dune');
  assert.equal(result[2].href, '/movie/42?type=tv');
  assert.equal(buildSearchSuggestions([phim], [], 'vi')[0].title, phim.name);
  assert.equal(buildSearchSuggestions([phim], [], 'en')[0].label, 'Completed');
});
test('source-only movies route by encoded slug and suggestions never exceed eight', () => {
  const sourceOnly = { ...phim, slug: 'test /?', tmdb: undefined, type: 'series' };
  assert.equal(buildSearchSuggestions([sourceOnly], [], 'en')[0].href, '/movie/0?type=tv&phimSlug=test%20%2F%3F');
  assert.equal(buildSearchSuggestions([], Array.from({ length: 20 }, (_, i) => ({ ...movie, id: i + 1 })), 'en').length, 8);
  assert.deepEqual(buildSearchSuggestions([], [{ ...movie, id: NaN }], 'en'), []);
});
