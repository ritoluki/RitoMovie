// Optional browser smoke check. Run with backend and frontend dev servers running:
// node tests/browser-smoke.cjs
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const browserPath = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ritomovie-smoke-'));
const browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;

(async () => {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break; } catch {}
    await sleep(100);
  }
  assert.ok(port, 'Chrome debugging endpoint started');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const runtimeErrors = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
    if (message.method === 'Fetch.requestPaused') {
      send('Fetch.failRequest', { requestId: message.params.requestId, errorReason: 'ConnectionFailed' }).catch(() => {});
    }
    const callback = pending.get(message.id);
    if (callback) {
      pending.delete(message.id);
      message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result);
    }
  };
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 150; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await sleep(200);
    }
    throw new Error(`Browser condition timed out: ${expression}`);
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('i18nextLng', 'vi')" });
  // Force TMDB requests to fail while the real PhimAPI backend remains available.
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/movies/*', requestStage: 'Request' }] });
  await send('Page.navigate', { url: 'http://localhost:5173/movie/718789?type=movie&phimSlug=lightyear-canh-sat-vu-tru' });
  await waitFor("document.querySelector('h1')?.textContent.includes('Lightyear')");
  await waitFor("document.body.textContent.includes('time travel')");
  assert.ok(await evaluate("[...document.querySelectorAll('a')].some(a => a.getAttribute('href')?.startsWith('/watch/718789?'))"));
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Thư viện ảnh').click()");
  await waitFor("document.querySelectorAll('img[alt^=\"Gallery image\"]').length > 0");
  assert.equal(await evaluate('document.documentElement.scrollWidth > window.innerWidth'), false);
  console.log('PASS: TMDB outage still renders details, keywords, watch link and image gallery');

  await send('Fetch.disable');
  await send('Page.navigate', { url: 'http://localhost:5173/browse?catalog=phim-le&phimYear=2020,2024&phimLang=vietsub' });
  await waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Bộ lọc')");
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Bộ lọc').click()");
  await waitFor("document.querySelector('#phim-language')");
  assert.equal(await evaluate("document.querySelector('#phim-language').value"), 'vietsub');
  assert.equal(await evaluate("document.querySelector('input[aria-label=\"Từ năm\"]').value"), '2020');
  assert.equal(await evaluate("document.querySelector('input[aria-label=\"Đến năm\"]').value"), '2024');
  console.log('PASS: language and year range survive URL navigation');

  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await waitFor("document.body.textContent.includes('Vừa cập nhật')");
  assert.deepEqual(runtimeErrors, []);
  console.log('PASS: recently updated section renders; no uncaught browser errors');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  socket?.close();
  const exited = new Promise(resolve => browser.once('exit', resolve));
  browser.kill();
  await Promise.race([exited, sleep(3000)]);
  // Remove only the unique test profile created above, after checking its absolute location.
  if (path.dirname(path.resolve(profile)) === path.resolve(os.tmpdir()) && path.basename(profile).startsWith('ritomovie-smoke-')) {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});
