// Requires Vite on localhost:5173; all API reads/writes are fixtures.
const assert = require('node:assert/strict');
const { runBrowserCheck } = require('./helpers/browser.cjs');
const { HOME_SECTIONS, defaultHomeSettings, sectionCandidates, materializeHomeSections, validateSectionPatch } = require('../../backend/dist/utils/homeSections');
const { projectMoviePayload, movieIsHidden } = require('../../backend/dist/utils/movieManagement');
const admin = { _id: 'home-ui-admin', name: 'Admin', email: 'admin@example.com', role: 'super_admin', watchlist: [] };
const movie = id => ({ id, title: `Movie ${id}`, original_title: `Movie ${id}`, overview: 'Synopsis', poster_path: '/poster.jpg', release_date: '2026-01-01', vote_average: 8, genre_ids: [] });
const source = {
  trending: { results: [movie(1), movie(2)] }, popular: { results: [movie(3), movie(1), movie(2)] }, topRated: { results: [movie(1), movie(2), movie(3)] },
  genres: {}, phim: {}, phimGenres: {}, updates: { items: [] }, managed: { featured: { items: [] }, trending: { items: [] } },
};
let revision = 0;
let sections = defaultHomeSettings();
const hidden = new Set();
const policies = () => [...hidden].map(id => ({ source: 'tmdb', slug: `tmdb:movie:${id}`, tmdbId: id, mediaType: 'movie', isHidden: true }));
const view = () => ({ revision, sections: [...sections].sort((a, b) => a.order - b.order).map(settings => {
  const definition = HOME_SECTIONS.find(def => def.id === settings.id);
  const { map, liveIds } = sectionCandidates(source, definition, settings);
  const keys = [...new Set([...settings.pinnedIds, ...settings.itemOrder, ...liveIds, ...map.keys()])];
  return { ...definition, ...settings, liveCount: liveIds.length, items: keys.filter(key => map.has(key)).map(key => ({
    key, movie: map.get(key), live: liveIds.includes(key), hidden: settings.hiddenIds.includes(key), pinned: settings.pinnedIds.includes(key),
    globallyHidden: movieIsHidden(map.get(key), policies(), 'movie'),
  })) };
}) });
const ok = data => ({ body: { success: true, data } });
const api = ({ path, method, body }) => {
  if (method === 'GET') {
    if (path === '/api/admin/home-layout') return ok(view());
    if (path === '/api/auth/me') return ok(admin);
    if (path === '/api/settings/public') return ok({ site_name: 'RitoMovie' });
    if (path === '/api/home/batch') {
      const data = projectMoviePayload(source, policies(), 'en', 'movie');
      data.homeSections = materializeHomeSections(data, sections, item => projectMoviePayload(item, policies(), 'en', 'movie'));
      return ok(data);
    }
    return ok([]);
  }
  if (path === '/api/admin/home-layout/order') {
    assert.equal(body.revision, revision);
    sections = sections.map(section => ({ ...section, order: body.order.indexOf(section.id) })); revision++;
    return ok(view());
  }
  if (path === '/api/admin/home-layout/reset') {
    assert.equal(body.revision, revision);
    sections = defaultHomeSettings(); revision++;
    return ok(view());
  }
  const matched = path.match(/^\/api\/admin\/home-layout\/sections\/([^/]+)(\/visibility)?$/);
  assert.ok(matched, `Unexpected write ${method} ${path}`);
  if (matched[2]) {
    const id = Number(body.key.split(':')[2]);
    body.hidden ? hidden.add(id) : hidden.delete(id);
    return ok(view());
  }
  assert.equal(body.revision, revision);
  const current = sections.find(section => section.id === matched[1]);
  const definition = HOME_SECTIONS.find(section => section.id === matched[1]);
  const { map } = sectionCandidates(source, definition, current);
  sections = sections.map(section => section.id === current.id ? validateSectionPatch(body, current, map) : section);
  revision++;
  return ok(view());
};
const bootstrap = `localStorage.setItem('i18nextLng','en'); localStorage.setItem('auth-storage',${JSON.stringify(JSON.stringify({ state: {
  user: admin, token: 'fixture-only-token', isAuthenticated: true, rememberMe: true,
}, version: 0 }))});`;

runBrowserCheck(api, bootstrap, async ({ navigate, waitFor, click, evaluate, requests }) => {
  const element = selector => `document.querySelector(${JSON.stringify(selector)})`;
  const control = aria => element(`button[aria-label="${aria}"]`);
  const button = text => `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)})`;
  const row = '[data-section-editor="top-rated"]';
  const ready = () => waitFor(`!${control('Toggle section top-rated')}?.disabled`);
  const publicTopRated = async () => {
    await navigate('/');
    await waitFor('document.querySelector("[data-home-section=top-rated]")');
    await evaluate('document.querySelector("[data-home-section=top-rated]").scrollIntoView(); true');
    await waitFor('document.querySelector("[data-home-section=top-rated]")?.textContent.includes("Movie")');
    return evaluate('document.querySelector("[data-home-section=top-rated]").innerText');
  };
  const adminTopRated = async () => {
    await navigate('/admin/home-layout');
    await waitFor('document.querySelector("[data-section-editor=top-rated]")?.textContent.includes("Movie 1") || document.querySelector("[data-section-editor=top-rated]")?.textContent.includes("Movie 4")');
    await ready();
  };

  await adminTopRated();
  assert.equal(await evaluate('document.querySelectorAll("[data-section-control]").length'), 17);
  await click(control('Toggle item tmdb:movie:1'));
  await waitFor(`${element(row + ' [data-home-item="tmdb:movie:1"]')}?.textContent.includes('Hidden here')`);
  let text = await publicTopRated();
  assert.equal(text.includes('Movie 1'), false);
  await evaluate('document.querySelector("[data-home-section=trending]").scrollIntoView(); true');
  await waitFor('document.querySelector("[data-home-section=trending]")?.textContent.includes("Movie 1")');
  console.log('PASS: existing rows are prefilled and section-local hiding leaves Trending intact');

  await adminTopRated();
  await click(control('Toggle item tmdb:movie:1')); await ready();
  await click(control('Pin item tmdb:movie:3'));
  await waitFor(`${element(row + ' [data-home-item="tmdb:movie:3"]')}?.textContent.includes('Pinned')`);
  await ready(); await click(control('Move item tmdb:movie:2 up')); await ready();
  await click(control('Toggle section popular')); await ready();
  while (await evaluate(`!${control('Move section top-rated up')}.disabled`)) {
    const before = await evaluate('Array.from(document.querySelectorAll("[data-section-control]")).findIndex(el=>el.dataset.sectionControl==="top-rated")');
    await click(control('Move section top-rated up'));
    await waitFor(`Array.from(document.querySelectorAll('[data-section-control]')).findIndex(el=>el.dataset.sectionControl==='top-rated') === ${before - 1}`);
    await ready();
  }
  text = await publicTopRated();
  assert.ok(text.indexOf('Movie 3') < text.indexOf('Movie 2') && text.indexOf('Movie 2') < text.indexOf('Movie 1'));
  assert.equal(await evaluate('Boolean(document.querySelector("[data-home-section=popular]"))'), false);
  assert.equal(await evaluate('document.querySelectorAll("[data-home-section]")[1].dataset.homeSection'), 'top-rated');
  console.log('PASS: pins, movie order, section visibility and section order render on the public home page');

  source.topRated.results = [movie(4), movie(2)];
  text = await publicTopRated();
  assert.ok(text.includes('Movie 3') && text.includes('Movie 4'));
  await adminTopRated();
  await click(button('Automatic order')); await ready();
  text = await publicTopRated();
  assert.ok(text.indexOf('Movie 3') < text.indexOf('Movie 4') && text.indexOf('Movie 4') < text.indexOf('Movie 2'));
  console.log('PASS: pins survive API rotations and automatic order keeps the pin');

  await adminTopRated();
  await click(control('Global visibility tmdb:movie:2'));
  await waitFor('document.querySelector("[role=alertdialog]")');
  await click(button('Confirm')); await ready();
  await click(button('Restore defaults'));
  await waitFor('document.querySelector("[role=alertdialog]")');
  await click(button('Confirm')); await ready();
  text = await publicTopRated();
  assert.equal(text.includes('Movie 2'), false);
  assert.equal(text.includes('Movie 3'), false);
  assert.equal(await evaluate('Boolean(document.querySelector("[data-home-section=popular]"))'), true);
  await adminTopRated();
  await click(control('Global visibility tmdb:movie:2'));
  await waitFor('document.querySelector("[role=alertdialog]")');
  await click(button('Confirm')); await ready();
  text = await publicTopRated();
  assert.ok(text.includes('Movie 2'));
  // Keep the same document/query cache to check the actual SPA return path.
  await evaluate("window.__spaMarker = 123; history.pushState({}, '', '/admin/home-layout'); window.dispatchEvent(new PopStateEvent('popstate')); true");
  await waitFor('document.querySelector("[data-section-editor=top-rated]")'); await ready();
  await click(control('Toggle section top-rated')); await ready();
  await click("Array.from(document.querySelectorAll('a')).find(a => a.getAttribute('href') === '/' && a.textContent.includes('Website'))");
  await waitFor("location.pathname === '/' && document.querySelectorAll('[data-home-section]').length > 0 && !document.querySelector('[data-home-section=top-rated]')");
  assert.equal(await evaluate('window.__spaMarker'), 123);
  console.log('PASS: returning through the Website link refreshes invalidated home data without a page reload');
  assert.ok(requests.filter(request => !['GET', 'OPTIONS'].includes(request.method)).every(request => request.path.startsWith('/api/admin/home-layout')));
  console.log('PASS: global visibility is confirmed and survives layout reset; no mass movie imports occur');
}).catch(error => { console.error(error); process.exitCode = 1; });
