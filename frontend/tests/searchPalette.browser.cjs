// Isolated built frontend; all APIs are fixtures and no real accounts/data are used.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { runBrowserCheck } = require('./helpers/browser.cjs');
const en = require('../public/locales/en/translation.json');
const vi = require('../public/locales/vi/translation.json');
const historyKey = 'ritomovie-search-history';
const ok = data => ({ body: { success: true, data } });
const source = { _id: 'demo', name: 'Dune tiếng Việt', origin_name: 'Dune', slug: 'dune', year: 2026, type: 'single', tmdb: { id: '42', type: 'movie' }, category: [], country: [], actor: [], content: 'Demo' };
let releaseOld;
const fixture = async ({ path: route, query }) => {
  if (route === '/api/settings/public') return ok({ site_name: 'RitoMovie', enable_comments: true });
  if (route === '/api/phim/search' || route === '/api/movies/search') {
    const keyword = query.get('keyword') || query.get('q');
    const isPhim = route.includes('/phim/');
    if (keyword === 'slow' && isPhim) await new Promise(resolve => { releaseOld = resolve; });
    if (keyword === 'error' || (keyword === 'partial' && !isPhim)) return { status: 503, body: { success: false, message: 'Fixture unavailable' } };
    const name = keyword === 'dune' ? 'Dune' : keyword === 'slow' ? 'Old movie' : keyword === 'arrival' ? 'Arrival' : keyword;
    const item = { ...source, name: `${name} tiếng Việt`, origin_name: name, slug: keyword, tmdb: { ...source.tmdb, id: keyword === 'arrival' ? '99' : '42' } };
    const items = keyword === 'empty' ? [] : [item];
    if (isPhim) return ok({ status: true, data: { items } });
    return ok({ results: keyword === 'empty' ? [] : [{ id: Number(item.tmdb.id), title: name, media_type: 'movie' }, { id: 123, title: `${name} Part Two`, media_type: 'movie' }], total_pages: 1 });
  }
  if (route.startsWith('/api/phim/list/')) return ok({ status: true, data: { items: [source], params: { pagination: { totalPages: 1, totalItems: 1, currentPage: 1 } } } });
  if (route.startsWith('/api/phim/movie/') && !route.endsWith('/extras')) return ok({ status: true, movie: source, episodes: [] });
  if (/^\/api\/movies\/\d+$/.test(route)) return ok({ id: 42, title: 'Dune', genres: [], production_countries: [], production_companies: [] });
  if (route.includes('/comments/movie/')) return ok({ comments: [], pagination: { total: 0 } });
  if (route.includes('/images')) return ok({ backdrops: [], posters: [] });
  if (route.includes('/credits')) return ok({ cast: [], crew: [] });
  if (route.includes('/extras')) return ok({ images: { backdrops: [], posters: [] }, cast: [], keywords: [] });
  if (route.includes('/release-dates')) return ok({ results: [] });
  if (route === '/api/movies/discover') return ok({ results: [], total_pages: 1 });
  return ok([]);
};

(async () => {
  const dist = path.resolve(__dirname, '../dist');
  const server = http.createServer((request, response) => {
    const requested = path.resolve(dist, '.' + new URL(request.url, 'http://localhost').pathname);
    const safe = requested.startsWith(dist + path.sep);
    const file = safe && fs.existsSync(requested) && fs.statSync(requested).isFile() ? requested : path.join(dist, 'index.html');
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  process.env.BROWSER_TEST_ORIGIN = `http://localhost:${server.address().port}`;
  try {
    await runBrowserCheck(fixture, "if(!localStorage.getItem('i18nextLng')) localStorage.setItem('i18nextLng','en');", async ({ navigate, click, fill, waitFor, evaluate, send, requests }) => {
      const trigger = `document.querySelector('header button[aria-label="${en.common.search}"]')`;
      const input = '[cmdk-input]';
      const key = async name => {
        const windowsVirtualKeyCode = { Enter: 13, Escape: 27, ArrowDown: 40, ArrowUp: 38 }[name];
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode, ...(name === 'Enter' ? { text: '\r' } : {}) });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode });
      };
      const open = async () => { await click(trigger); await waitFor(`document.activeElement?.hasAttribute('cmdk-input')`); };
      const history = () => evaluate(`JSON.parse(localStorage.getItem('${historyKey}') || '[]')`);
      const screenshot = async name => {
        const directory = path.resolve(__dirname, '../test-results/search-palette');
        fs.mkdirSync(directory, { recursive: true });
        const result = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(directory, name + '.png'), Buffer.from(result.data, 'base64'));
      };
      await navigate('/browse?catalog=phim-bo');
      await waitFor(`${trigger}`);
      await evaluate("document.body.style.minHeight = '200vh'");
      const before = await evaluate(`${trigger}.getBoundingClientRect().x`);
      await open();
      assert.equal(await evaluate(`${trigger}.getBoundingClientRect().x`), before, 'modal must not shift header');
      await waitFor(`(() => { const r = document.querySelector('[role=dialog]').getBoundingClientRect(); return Math.abs(r.x + r.width/2 - innerWidth/2) < 1; })()`);
      await fill(input, 'd'); await fill(input, 'du'); await fill(input, 'dun'); await fill(input, 'dune');
      await waitFor(`document.querySelector('[cmdk-item][data-value="phim:dune"]')`);
      await waitFor(`!document.body.innerText.includes(${JSON.stringify(en.searchPalette.searching)})`);
      assert.equal(requests.filter(r => r.path.endsWith('/search') && r.method === 'GET').length, 2, 'one request per source after debounce');
      assert.equal(await evaluate(`document.querySelectorAll('[cmdk-item][data-value="tmdb:movie:42"]').length`), 0, 'duplicate canonical movie omitted');
      assert.deepEqual(await history(), [], 'typing does not save history');
      await screenshot('desktop');
      await key('Escape'); await waitFor(`!document.querySelector('[role=dialog]')`);
      await waitFor(`document.activeElement === ${trigger}`);
      console.log('PASS: centered popup, autofocus, debounce, deduplication, stable header and Escape focus return');

      await open();
      await fill(input, 'slow');
      while (!releaseOld) await new Promise(resolve => setTimeout(resolve, 10));
      await fill(input, 'arrival');
      await waitFor(`document.querySelector('[cmdk-item][data-value="phim:arrival"]')`);
      releaseOld();
      await new Promise(resolve => setTimeout(resolve, 150));
      assert.equal(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Old movie')`), false);
      await key('ArrowDown');
      await waitFor(`document.querySelector('[cmdk-item][data-value="phim:arrival"]')?.getAttribute('aria-selected') === 'true'`);
      await key('Enter');
      await waitFor(`location.pathname === '/movie/99' && new URLSearchParams(location.search).get('phimSlug') === 'arrival'`);
      await waitFor(`document.querySelector('h1')?.textContent === 'Dune'`);
      assert.deepEqual(await history(), ['arrival']);
      console.log('PASS: stale requests cannot replace current results; arrow keys/Enter open the selected movie and save the committed keyword');

      await open();
      await waitFor(`document.querySelector('[cmdk-item][data-value="history:arrival"]')`);
      await fill(input, 'dune');
      await waitFor(`document.querySelector('[cmdk-item][data-value="phim:dune"]')`);
      await key('Enter');
      await waitFor(`location.pathname === '/browse' && new URLSearchParams(location.search).get('q') === 'dune'`);
      assert.deepEqual(await history(), ['dune', 'arrival']);
      await open();
      await evaluate(`document.querySelector('button[aria-label="Remove arrival from search history"]').focus()`);
      await key('Enter');
      await waitFor(`JSON.parse(localStorage.getItem('${historyKey}')).length === 1`);
      assert.equal(await evaluate('location.pathname + location.search'), '/browse?q=dune', 'keyboard deletion must not activate a search result');
      assert.deepEqual(await history(), ['dune']);
      await click(`Array.from(document.querySelectorAll('[role=dialog] button')).find(b => b.textContent === ${JSON.stringify(en.searchPalette.clearHistory)})`);
      assert.deepEqual(await history(), []);
      await fill(input, 'empty');
      await waitFor(`document.querySelector('[role=dialog]').textContent.includes('No movies found')`);
      await fill(input, 'partial');
      await waitFor(`document.querySelector('[role=dialog]').textContent.includes(${JSON.stringify(en.searchPalette.partial)})`);
      assert.ok(await evaluate(`!!document.querySelector('[cmdk-item][data-value="phim:partial"]')`));
      await fill(input, 'error');
      await waitFor(`document.querySelector('[role=alert]')?.textContent.includes(${JSON.stringify(en.searchPalette.failed)})`);
      await key('Escape');
      console.log('PASS: Enter opens full search; history can be removed/cleared; empty, partial failure and full failure states work');

      await evaluate("localStorage.setItem('i18nextLng','vi')");
      await navigate('/browse?catalog=phim-bo');
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await waitFor(`document.querySelector('header button[aria-label="${vi.common.search}"]')`);
      await click(`document.querySelector('header button[aria-label="${vi.common.search}"]')`);
      await waitFor(`document.activeElement?.hasAttribute('cmdk-input')`);
      await fill(input, 'dune');
      await waitFor(`document.querySelector('[cmdk-item][data-value="phim:dune"]')?.textContent.includes('Dune tiếng Việt')`);
      assert.ok(await evaluate(`(() => {const r=document.querySelector('[role=dialog]').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;})()`));
      await screenshot('mobile');
      console.log('PASS: Vietnamese results and mobile popup stay within the viewport');
    });
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
