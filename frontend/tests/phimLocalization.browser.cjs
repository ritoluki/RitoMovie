// Optional local browser check: start Vite on localhost:5173, then run this file.
// All API requests use fixtures; this check never writes to the application's database.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ritomovie-i18n-'));
const chrome = spawn(process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
  { windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let streamRequests = 0;
const exceptions = [];
const source = {
  _id: 'i18n-demo', slug: 'i18n-demo', name: 'Tên phim tiếng Việt', origin_name: 'Original Demo',
  content: '<p>Nội dung gốc tiếng Việt</p>', type: 'series', status: 'completed', year: 2026,
  thumb_url: '/demo.jpg', poster_url: '/demo.jpg', time: '24 phút/tập',
  episode_current: 'Hoàn Tất (2/2)', episode_total: '2 Tập', lang: 'Vietsub + Lồng Tiếng', quality: 'HD',
  category: [{ name: 'Hài', slug: 'hai-huoc' }], country: [{ name: 'Nhật Bản', slug: 'nhat-ban' }],
  actor: [], director: [], tmdb: { id: '4242', type: 'tv' },
};
const episodes = [{ server_name: 'Vietsub #1', server_data: [1, 2].map(n => ({
  name: `Tập ${n}`, slug: `tap-${n}`, filename: '', link_m3u8: '', link_embed: 'about:blank',
})) }];
const timeout = setTimeout(() => { console.error('Browser check timed out'); chrome.kill(); process.exit(1); }, 90_000);

(async () => {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch { await sleep(100); }
  }
  assert.ok(port, 'Chrome started');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.onmessage = async event => {
    const message = JSON.parse(event.data);
    const callback = pending.get(message.id);
    if (callback) {
      pending.delete(message.id);
      message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (message.method !== 'Fetch.requestPaused') return;
    try {
      const { requestId, request } = message.params;
      const pathname = new URL(request.url).pathname;
      const language = Object.entries(request.headers).find(([key]) => key.toLowerCase() === 'accept-language')?.[1] || 'en';
      assert.ok(['GET', 'OPTIONS'].includes(request.method), 'No database writes');
      let data = [];
      if (pathname === '/api/settings/public') data = { site_name: 'RitoMovie', enable_comments: true };
      else if (pathname === '/api/phim/genres') data = source.category;
      else if (pathname === '/api/phim/countries') data = source.country;
      else if (/\/api\/phim\/movie\/i18n-(demo|no-tmdb)$/.test(pathname)) {
        streamRequests++;
        data = { status: true, movie: { ...source, tmdb: pathname.endsWith('no-tmdb') ? undefined : source.tmdb }, episodes };
      } else if (pathname.endsWith('/extras')) data = { images: { backdrops: [], posters: [] }, cast: [], keywords: [], unavailable: [] };
      else if (pathname === '/api/phim/list/phim-bo') data = { status: 'success', data: {
        items: [source], params: { pagination: { totalItems: 1, totalPages: 1, totalItemsPerPage: 24, currentPage: 1 } },
      } };
      else if (pathname === '/api/movies/4242') data = {
        id: 4242, title: language.startsWith('vi') ? 'Tiêu đề TMDB' : 'English Demo',
        overview: language.startsWith('vi') ? 'Nội dung từ TMDB' : 'English synopsis from TMDB',
        genres: [], production_countries: [], production_companies: [], networks: [],
        vote_average: 8, vote_count: 1, release_date: '2026-01-01', runtime: 24,
        poster_path: null, backdrop_path: null,
      };
      else if (pathname.endsWith('/images')) data = { backdrops: [], posters: [] };
      else if (pathname.endsWith('/credits')) data = { cast: [], crew: [] };
      else if (pathname.endsWith('/release-dates')) data = { results: [] };
      else if (pathname.includes('/comments/')) data = { comments: [], pagination: { page: 1, total: 0, pages: 1 } };
      await send('Fetch.fulfillRequest', { requestId, responseCode: request.method === 'OPTIONS' ? 204 : 200,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json; charset=utf-8' },
          { name: 'Access-Control-Allow-Origin', value: 'http://localhost:5173' },
          { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Accept-Language' },
          { name: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
        ], body: Buffer.from(JSON.stringify({ success: true, data })).toString('base64'),
      });
    } catch (error) { exceptions.push(String(error)); }
  };
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 100; i++) { if (await evaluate(`Boolean(${expression})`)) return; await sleep(100); }
    throw new Error(`Condition failed: ${expression}\n${await evaluate('document.body.innerText.slice(0,1800)')}`);
  };
  const language = code => evaluate(`import('/src/i18n/config.ts').then(m => m.default.changeLanguage('${code}')).then(() => true)`);
  const navigate = async route => {
    await send('Page.navigate', { url: `http://localhost:5173${route}` });
    await waitFor('document.querySelector("#root")?.children.length');
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*://localhost:5000/api/*' }, { urlPattern: '*://localhost:5173/api/*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('i18nextLng', 'en');" });

  await navigate('/browse?catalog=phim-bo');
  await waitFor('document.body.innerText.includes("Original Demo")');
  assert.equal(await evaluate('document.body.innerText.includes("Tên phim tiếng Việt")'), false);
  await language('vi');
  await waitFor('document.body.innerText.includes("Tên phim tiếng Việt")');
  console.log('PASS: catalog cards switch between original and Vietnamese names');

  await navigate('/watch/i18n-demo?type=tv');
  await waitFor('document.querySelector("h1")?.textContent === "English Demo"');
  await waitFor('document.body.innerText.includes("English synopsis from TMDB")');
  assert.ok(await evaluate('document.body.textContent.includes("Completed (2/2)") && document.body.textContent.includes("Vietnamese subtitles") && document.body.textContent.includes("Japan")'));
  await evaluate('Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Episode 2").click()');
  await waitFor('new URLSearchParams(location.search).get("episode") === "tap-2"');
  await evaluate('window.__playerBeforeSwitch = document.querySelector("iframe"); true');
  const beforeSwitch = streamRequests;
  await language('vi');
  await waitFor('document.querySelector("h1")?.textContent === "Tên phim tiếng Việt"');
  await waitFor('document.body.innerText.includes("Nội dung từ TMDB")');
  assert.ok(await evaluate('window.__playerBeforeSwitch === document.querySelector("iframe") && new URLSearchParams(location.search).get("episode") === "tap-2"'));
  assert.equal(streamRequests, beforeSwitch);
  console.log('PASS: watch metadata changes language without replacing the player, source or selected episode');

  await navigate('/movie/0?type=tv&phimSlug=i18n-demo');
  await waitFor('document.body.innerText.includes("English Demo") && document.body.innerText.includes("English synopsis from TMDB")');
  console.log('PASS: slug detail pages resolve TMDB metadata');

  await navigate('/movie/0?type=tv&phimSlug=i18n-no-tmdb');
  await waitFor('document.body.innerText.includes("Original Demo") && document.body.innerText.includes("No overview available")');
  assert.ok(await evaluate('document.body.innerText.includes("Comedy") && document.body.innerText.includes("Japan") && !document.body.innerText.includes("Nội dung gốc tiếng Việt")'));
  await language('vi');
  await waitFor('document.body.innerText.includes("Nội dung gốc tiếng Việt")');
  console.log('PASS: missing English descriptions use the empty-state message and Vietnamese remains available');
  assert.deepEqual(exceptions, []);
  await send('Browser.close');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  clearTimeout(timeout);
  socket?.close();
  chrome.kill();
  await sleep(500);
  if (path.resolve(profile).startsWith(path.resolve(os.tmpdir()) + path.sep + 'ritomovie-i18n-')) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch {}
  }
});
