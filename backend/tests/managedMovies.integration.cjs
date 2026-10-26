// Optional: node --test tests/managedMovies.integration.cjs (requires local MongoDB).
// Uses its own newly created database, stubbed upstream APIs and no real accounts.
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
process.env.JWT_SECRET = 'managed-movie-integration-test-secret';
const interval = global.setInterval;
const intervalMock = mock.method(global, 'setInterval', (...args) => interval(...args).unref());
const phim = require('../dist/services/phimApiService');
const tmdb = require('../dist/services/tmdbService');
const recommendations = require('../dist/services/recommendationService');
const ManagedMovie = require('../dist/models/ManagedMovie').default;
const User = require('../dist/models/User').default;
const Comment = require('../dist/models/Comment').default;
const Rating = require('../dist/models/Rating').default;
const WatchHistory = require('../dist/models/WatchHistory').default;
const { publicMoviePolicy } = require('../dist/middleware/publicMoviePolicy');
const errorHandler = require('../dist/middleware/errorHandler').default;

test('admin management applies to public cached catalogs, details, playback, recommendations and home sections', { timeout: 60000 }, async t => {
  const dbName = `ritomovie_management_test_${process.pid}_${Date.now()}`;
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.name === dbName && /^ritomovie_management_test_\d+_\d+$/.test(dbName)) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    mock.restoreAll();
  });
  await mongoose.connect('mongodb://127.0.0.1:27017', { dbName, serverSelectionTimeoutMS: 5000 });
  await ManagedMovie.init();
  const baseMovie = { slug: 'management-demo', name: 'Phim demo', origin_name: 'Demo', year: 2026, type: 'series',
    category: [{ name: 'Drama', slug: 'chinh-kich' }], country: [], tmdb: { id: '42', type: 'tv' },
    thumb_url: 'https://images.example/original.jpg', poster_url: 'https://images.example/wide.jpg', content: 'Original content' };
  const secondSeason = { ...baseMovie, slug: 'management-demo-two', name: 'Second season' };
  const episodes = [{ server_name: 'Source', server_data: [{ name: '1', slug: '1', link_m3u8: 'https://video.example/stream.m3u8' }] }];
  const catalog = { status: 'success', data: { items: [baseMovie, secondSeason], params: { pagination: { currentPage: 1, totalPages: 1, totalItems: 2 } } } };
  const details = slug => ({ status: true, movie: slug === secondSeason.slug ? secondSeason : baseMovie, episodes });
  mock.method(phim, 'getMovieBySlug', async slug => details(slug));
  mock.method(phim, 'getMovieByTmdb', async () => details(baseMovie.slug));
  for (const name of ['getHomeUpdates', 'getLatestMovies', 'getCatalogList', 'getGenreDetail', 'getCountryDetail', 'getYearDetail', 'searchMovies']) mock.method(phim, name, async () => catalog);
  mock.method(phim, 'searchMovies', async params => params.keyword === 'Managed title'
    ? { status: 'success', data: { items: [], params: { pagination: { totalItems: 0, totalPages: 0 } } } } : catalog);
  mock.method(phim, 'getMovieExtras', async () => ({ images: { backdrops: [], posters: [] }, keywords: [], cast: [] }));
  const tv = { id: 42, name: 'Demo series', first_air_date: '2026-01-01', poster_path: '/demo.jpg', overview: 'TMDB synopsis' };
  const collision = { id: 42, title: 'Different movie with the same number', release_date: '2026-01-01', poster_path: '/movie.jpg' };
  mock.method(tmdb, 'getTvDetails', async () => tv);
  mock.method(tmdb, 'getMovieDetails', async () => collision);
  for (const name of ['getTrendingMovies', 'getPopularMovies', 'getTopRatedMovies', 'getMoviesByGenre']) mock.method(tmdb, name, async () => ({ results: [tv, collision] }));
  mock.method(recommendations, 'getPlayableRecommendations', async () => ({ items: [baseMovie, secondSeason], partial: false }));

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.language = req.headers['accept-language'] || 'en'; next(); });
  app.use('/api/admin', require('../dist/routes/admin').default);
  app.use(['/api/phim', '/api/movies', '/api/home'], publicMoviePolicy);
  app.use('/api/phim', require('../dist/routes/phim').default);
  app.use('/api/movies', require('../dist/routes/movies').default);
  app.use('/api/home', require('../dist/routes/home').default);
  app.use(errorHandler);
  intervalMock.mock.restore();
  server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const admin = await User.create({ name: 'Test Admin', email: 'admin@example.com', password: 'Test-only-Password1!', role: 'super_admin' });
  const member = await User.create({ name: 'Test Member', email: 'member@example.com', password: 'Test-only-Password1!', role: 'user' });
  const token = admin.getSignedJwtToken();
  const request = async (url, { method = 'GET', body, auth, language = 'en' } = {}) => {
    const response = await fetch(origin + url, { method, headers: { 'Content-Type': 'application/json', 'Accept-Language': language,
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, json: await response.json() };
  };
  const adminRequest = (url, options = {}) => request(url, { ...options, auth: token });
  assert.equal((await request('/api/admin/movies')).status, 401);
  assert.equal((await request('/api/admin/movies', { auth: member.getSignedJwtToken() })).status, 403);
  assert.equal((await request('/api/admin/home-layout', { auth: member.getSignedJwtToken() })).status, 403);
  let layout = (await adminRequest('/api/admin/home-layout')).json.data;
  assert.equal(layout.sections.length, 17, 'Existing sections are prefilled without importing movies');
  const sectionById = id => layout.sections.find(section => section.id === id);
  assert.equal(sectionById('top-rated').items.length, 2);
  assert.equal(await ManagedMovie.countDocuments(), 0);
  const editSection = async (id, patch, revision = layout.revision) => {
    const response = await adminRequest(`/api/admin/home-layout/sections/${id}`, { method: 'PUT', body: { revision, ...patch } });
    if (response.status === 200) layout = response.json.data;
    return response;
  };
  const staleRevision = layout.revision;
  assert.equal((await editSection('top-rated', { hiddenIds: ['tmdb:tv:42'] })).status, 200);
  let configuredHome = (await request('/api/home/batch')).json.data;
  assert.equal(configuredHome.homeSections.find(section => section.id === 'top-rated').items.length, 1);
  assert.equal(configuredHome.homeSections.find(section => section.id === 'trending').items.length, 2);
  assert.equal((await request('/api/movies/42?type=tv')).status, 200, 'Section-local hiding must not block the detail page');
  assert.equal((await editSection('top-rated', { enabled: false }, staleRevision)).status, 409, 'Concurrent editors must not overwrite each other');
  assert.equal((await editSection('top-rated', { pinnedIds: ['tmdb:movie:999'] })).status, 400);
  assert.equal((await editSection('top-rated', { savedItems: [] })).status, 400);
  await editSection('top-rated', { hiddenIds: [], pinnedIds: ['tmdb:movie:42'], itemOrder: ['tmdb:tv:42'] });
  configuredHome = (await request('/api/home/batch')).json.data;
  assert.equal(configuredHome.homeSections.find(section => section.id === 'top-rated').items[0].title, collision.title);
  const ids = layout.sections.map(section => section.id);
  const desiredOrder = ['hero', 'top-rated', ...ids.filter(id => !['hero', 'top-rated'].includes(id))];
  let reordered = await adminRequest('/api/admin/home-layout/order', { method: 'PUT', body: { revision: layout.revision, order: desiredOrder } });
  assert.equal(reordered.status, 200); layout = reordered.json.data;
  assert.equal((await request('/api/home/batch')).json.data.homeSections[1].id, 'top-rated');
  await editSection('popular', { enabled: false });
  assert.equal((await request('/api/home/batch')).json.data.homeSections.some(section => section.id === 'popular'), false);
  let visibility = await adminRequest('/api/admin/home-layout/sections/top-rated/visibility', { method: 'POST', body: { key: 'tmdb:tv:42', hidden: true } });
  assert.equal(visibility.status, 200); layout = visibility.json.data;
  assert.equal((await request('/api/movies/42?type=tv')).status, 404);
  assert.equal((await request(`/api/phim/movie/${baseMovie.slug}`)).status, 404, 'Canonical visibility covers matching PhimAPI sources');
  assert.equal((await request('/api/movies/42?type=movie')).status, 200);
  const reset = await adminRequest('/api/admin/home-layout/reset', { method: 'POST', body: { revision: layout.revision } });
  assert.equal(reset.status, 200); layout = reset.json.data;
  assert.equal(sectionById('popular').enabled, true);
  assert.deepEqual(sectionById('top-rated').pinnedIds, []);
  assert.equal((await request('/api/movies/42?type=tv')).status, 404, 'Layout reset must preserve global visibility');
  visibility = await adminRequest('/api/admin/home-layout/sections/top-rated/visibility', { method: 'POST', body: { key: 'tmdb:tv:42', hidden: false } });
  assert.equal(visibility.status, 200);
  assert.equal((await request(`/api/phim/movie/${baseMovie.slug}`)).status, 200);
  const canonicalRule = await ManagedMovie.findOne({ source: 'tmdb', tmdbId: 42 });
  assert.ok(canonicalRule);
  await adminRequest(`/api/admin/movies/${canonicalRule._id}`, { method: 'DELETE' });
  assert.equal((await adminRequest('/api/admin/movies')).json.data.length, 0);
  assert.equal((await adminRequest('/api/admin/movies/source?keyword=demo')).json.data.length, 2);
  const imported = await adminRequest('/api/admin/movies/import-phim', { method: 'POST', body: { slug: baseMovie.slug } });
  assert.equal(imported.status, 200);
  const id = imported.json.data._id;
  assert.equal(imported.json.data.tmdb_id, 42);
  const second = await adminRequest('/api/admin/movies/import-phim', { method: 'POST', body: { slug: secondSeason.slug } });
  const secondId = second.json.data._id;
  assert.equal((await adminRequest('/api/admin/movies/source')).json.data[0].managedId, id);
  assert.equal((await adminRequest('/api/admin/movies?search=%5B.*%5D')).json.data.length, 0);
  assert.equal((await adminRequest(`/api/admin/movies/${id}`, { method: 'PUT', body: { isHidden: 'false' } })).status, 400);
  assert.equal((await adminRequest(`/api/admin/movies/${id}`, { method: 'PUT', body: { slug: 'replace' } })).status, 400);
  assert.equal((await adminRequest('/api/admin/movies/not-an-id')).status, 400);

  const edited = await adminRequest(`/api/admin/movies/${id}`, { method: 'PUT', body: {
    isFeatured: true, isTrending: true,
    overrides: { titles: { vi: 'Tên quản trị', en: 'Managed title' }, overviews: { en: 'Managed synopsis' }, posterUrl: 'https://images.example/managed.jpg' },
  } });
  assert.equal(edited.status, 200);
  assert.equal((await request('/api/phim/search?keyword=Managed%20title')).json.data.data.items.length, 1, 'Site title overrides must be searchable');
  const publicDetail = (await request(`/api/phim/movie/${baseMovie.slug}`)).json.data.movie;
  assert.equal(publicDetail.siteOverrides.titles.en, 'Managed title');
  assert.equal(publicDetail.thumb_url, 'https://images.example/managed.jpg');
  assert.equal(baseMovie.thumb_url, 'https://images.example/original.jpg');
  let home = await request('/api/home/batch');
  assert.equal(home.status, 200);
  assert.equal(home.json.data.managed.featured.items[0].slug, baseMovie.slug);
  assert.equal(home.json.data.managed.trending.items.length, 1);

  // A globally hidden title can remain in a saved curated/search snapshot after
  // leaving every live upstream list. That snapshot must never resurrect it.
  const offSource = await ManagedMovie.create({ source: 'phimapi', slug: 'off-source', tmdbId: 77, mediaType: 'tv',
    snapshot: { ...baseMovie, slug: 'off-source', tmdb: { id: '77', type: 'tv' } },
    isFeatured: true, overrides: { titles: { en: 'Off source title' } } });
  const offSourceRule = await ManagedMovie.create({ source: 'tmdb', slug: 'tmdb:tv:77', tmdbId: 77, mediaType: 'tv',
    snapshot: { ...tv, id: 77, slug: 'tmdb:tv:77', siteSource: 'tmdb', tmdb: { id: '77', type: 'tv' } }, isHidden: true });
  assert.equal((await request('/api/home/batch')).json.data.managed.featured.items.some(movie => movie.slug === 'off-source'), false);
  assert.equal(JSON.stringify((await request('/api/phim/search?keyword=Off%20source%20title')).json).includes('"slug":"off-source"'), false);
  const preview = (await adminRequest('/api/admin/home-layout')).json.data;
  assert.equal(preview.sections.find(section => section.id === 'featured').items.find(item => item.key === 'phim:off-source').globallyHidden, true);
  assert.equal((await adminRequest(`/api/admin/movies/${offSource._id}`)).json.data.effectiveHidden, true);
  const blockedCatalog = (await adminRequest('/api/admin/movies?search=off-source')).json.data[0];
  assert.equal(blockedCatalog.isHidden, false);
  assert.equal(blockedCatalog.effectiveHidden, true);
  await ManagedMovie.deleteMany({ _id: { $in: [offSource._id, offSourceRule._id] } });

  assert.equal((await adminRequest('/api/admin/movies/bulk-action', { method: 'POST', body: { action: 'hide', movieIds: [id] } })).status, 200);
  baseMovie.year = 2027;
  const refreshed = (await adminRequest('/api/admin/movies/import-phim', { method: 'POST', body: { slug: baseMovie.slug } })).json.data;
  assert.equal(refreshed.isHidden, true);
  assert.equal(refreshed.isFeatured, true);
  assert.equal(refreshed.overrides.titles.en, 'Managed title');
  assert.equal(refreshed.snapshot.year, 2027);
  assert.equal((await request('/api/phim/search?keyword=Managed%20title')).json.data.data.items.length, 0, 'Hidden title overrides must not leak through search');
  assert.equal((await ManagedMovie.countDocuments()), 2);
  for (const path of [`/api/phim/movie/${baseMovie.slug}`, `/api/phim/movie/${baseMovie.slug}/extras`, '/api/phim/tmdb/tv/42']) {
    const blocked = await request(path);
    assert.equal(blocked.status, 404, path);
    assert.equal(blocked.json.code, 'MOVIE_UNAVAILABLE');
    assert.equal(JSON.stringify(blocked.json).includes('stream.m3u8'), false);
  }
  assert.equal((await request(`/api/phim/movie/${secondSeason.slug}`)).status, 200);
  assert.equal((await request('/api/movies/42?type=tv')).status, 200, 'A visible season keeps canonical TV metadata available');
  for (const path of ['/api/phim/home', '/api/phim/list/phim-bo', '/api/phim/search?keyword=demo', '/api/phim/genres/chinh-kich', '/api/phim/countries/nhat-ban', '/api/phim/years/2026', '/api/phim/latest']) {
    const response = await request(path);
    const body = JSON.stringify(response.json);
    assert.equal(response.status, 200, path);
    assert.equal(body.includes('"slug":"management-demo"'), false, path);
    assert.equal(body.includes('management-demo-two'), true, path);
  }
  home = await request('/api/home/batch');
  assert.equal(home.json.cached, true, 'Exercise a previously cached batch');
  assert.deepEqual(home.json.data.managed.featured.items, []);
  assert.equal(home.json.data.phim.phimBo.items.length, 1);
  assert.equal((await request(`/api/phim/recommendations?slug=${secondSeason.slug}&type=tv`)).json.data.items.length, 1);
  await adminRequest('/api/admin/movies/bulk-action', { method: 'POST', body: { action: 'hide', movieIds: [secondId] } });
  assert.equal((await request('/api/movies/42?type=tv')).status, 404);
  assert.equal((await request('/api/movies/42?type=movie')).status, 200, 'Movie and TV IDs must remain distinct');
  await adminRequest(`/api/admin/movies/${id}`, { method: 'PUT', body: { isHidden: false, overrides: { titles: {}, overviews: {} } } });
  assert.equal((await request('/api/movies/42?type=tv')).json.data.name, tv.name);
  assert.equal((await request('/api/home/batch')).json.data.managed.featured.items.length, 1);
  await Comment.collection.insertOne({ user: member._id, movie: 42, text: 'Preserve this comment' });
  await Rating.collection.insertOne({ user: member._id, movieId: 42, rating: 5 });
  await WatchHistory.collection.insertOne({ user: member._id, movieId: 42, progress: 15 });
  await adminRequest('/api/admin/movies/bulk-action', { method: 'POST', body: { action: 'remove', movieIds: [id, secondId] } });
  assert.equal(await ManagedMovie.countDocuments(), 0);
  assert.equal(await Comment.countDocuments(), 1);
  assert.equal(await Rating.countDocuments(), 1);
  assert.equal(await WatchHistory.countDocuments(), 1);
  assert.equal((await request(`/api/phim/movie/${baseMovie.slug}`)).status, 200);
  assert.equal(catalog.data.items.length, 2, 'The upstream cached list must remain unchanged');
});
