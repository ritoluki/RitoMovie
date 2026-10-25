const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

// Let the production cache keep its cleanup timers without keeping this test worker alive.
const setInterval = global.setInterval;
const intervalMock = mock.method(global, 'setInterval', (...args) => setInterval(...args).unref());
const { apiCache } = require('../dist/utils/cache');
const phim = require('../dist/services/phimApiService');
const tmdb = require('../dist/services/tmdbService');
const { getPlayableRecommendations } = require('../dist/services/recommendationService');
intervalMock.mock.restore();

const source = { slug: 'source', name: 'Source', type: 'single', tmdb: { id: '1', type: 'movie' },
  category: [{ slug: 'action' }], country: [{ slug: 'korea' }] };
const playable = { ...source, slug: 'playable', name: 'Playable', tmdb: { id: '2', type: 'movie' } };
const unavailable = { ...playable, slug: 'no-stream', tmdb: { id: '3', type: 'movie' } };
const countryOnly = { ...playable, slug: 'country-only', category: [], tmdb: { id: '4', type: 'movie' } };
const stream = [{ server_data: [{ link_m3u8: 'https://cdn.example.com/movie.m3u8' }] }];
const options = { slug: 'source', tmdbId: 1, type: 'movie', language: 'vi' };

function mockCatalog(t, counter) {
  t.mock.method(phim, 'getRecommendationResource', async path => {
    counter.push(path);
    if (path === '/phim/source') {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { movie: source, episodes: stream };
    }
    if (path.includes('/country-only/keywords')) return { data: { keywords: [] } };
    if (path.includes('/keywords')) return { data: { keywords: [{ name: 'space' }] } };
    if (path === '/phim/playable') return { movie: playable, episodes: stream };
    if (path === '/phim/no-stream') return { movie: unavailable, episodes: [] };
    if (path === '/phim/country-only') return { movie: countryOnly, episodes: stream };
    if (path.includes('/the-loai/') || path.includes('/quoc-gia/')) return { data: { items: [source, playable, unavailable, playable, countryOnly] } };
    return undefined;
  });
}

test('PhimAPI recommendations survive TMDB failure and only return verified unique sources', async t => {
  apiCache.clear();
  mockCatalog(t, []);
  t.mock.method(tmdb, 'getMovieRecommendations', async () => { throw new Error('TMDB unavailable'); });
  const result = await getPlayableRecommendations(options);
  assert.equal(result.partial, true);
  assert.deepEqual(result.items.map(movie => movie.slug), ['playable']);
  assert.equal(result.items[0].available, true);
  assert.equal(result.items[0].reason, 'keywords');
  assert.equal('episodes' in result.items[0], false);
});

test('simultaneous requests share computation and subsequent requests use cached results', async t => {
  apiCache.clear();
  const calls = [];
  mockCatalog(t, calls);
  t.mock.method(tmdb, 'getMovieRecommendations', async () => ({ results: [] }));
  const results = await Promise.all([getPlayableRecommendations(options), getPlayableRecommendations(options)]);
  assert.deepEqual(results[0], results[1]);
  assert.equal(calls.filter(path => path === '/phim/source').length, 1);
  const previousCalls = calls.length;
  await getPlayableRecommendations(options);
  assert.equal(calls.length, previousCalls);
});

test('upstream outages produce a retryable error instead of a cached empty success', async t => {
  apiCache.clear();
  t.mock.method(phim, 'getRecommendationResource', async () => { throw new Error('PhimAPI unavailable'); });
  t.mock.method(tmdb, 'getMovieRecommendations', async () => { throw new Error('TMDB unavailable'); });
  await assert.rejects(getPlayableRecommendations(options), { statusCode: 503 });
});
