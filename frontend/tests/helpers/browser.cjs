const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.runBrowserCheck = async (api, bootstrap, check) => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ritomovie-browser-'));
  const chrome = spawn(process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    let port;
    for (let i = 0; i < 100 && !port; i++) {
      try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch { await sleep(100); }
    }
    assert.ok(port, 'Chrome started');
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Browser debugger connection timed out')), 10000);
      socket.onopen = () => { clearTimeout(timeout); resolve(); };
      socket.onerror = event => { clearTimeout(timeout); reject(new Error(event.message || 'Browser debugger connection failed')); };
      socket.onclose = () => { clearTimeout(timeout); reject(new Error('Browser debugger closed during connection')); };
    });
    let nextId = 0;
    const pending = new Map();
    const errors = [];
    const requests = [];
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Browser command timed out: ${method}`)); }, 10000);
      pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
      socket.send(JSON.stringify({ id, method, params }));
    });
    socket.onclose = () => {
      for (const callback of pending.values()) callback.reject(new Error('Browser debugger disconnected'));
      pending.clear();
    };
    socket.onmessage = async event => {
      const message = JSON.parse(event.data);
      const callback = pending.get(message.id);
      if (callback) {
        pending.delete(message.id);
        message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result);
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      if (message.method !== 'Fetch.requestPaused') return;
      const { requestId, request } = message.params;
      try {
        const url = new URL(request.url);
        const input = { path: url.pathname, query: url.searchParams, method: request.method, body: request.postData ? JSON.parse(request.postData) : undefined };
        requests.push(input);
        const response = request.method === 'OPTIONS' ? { status: 204, body: {} } : await api(input);
        await send('Fetch.fulfillRequest', { requestId, responseCode: response.status || 200,
          responseHeaders: [
            { name: 'Content-Type', value: 'application/json; charset=utf-8' },
            { name: 'Access-Control-Allow-Origin', value: 'http://localhost:5173' },
            { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Accept-Language' },
            { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          ], body: Buffer.from(JSON.stringify(response.body)).toString('base64'),
        });
      } catch (error) {
        errors.push(String(error));
        await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
      }
    };
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 150; i++) { if (await evaluate(`Boolean(${expression})`)) return; await sleep(100); }
      throw new Error(`Condition failed: ${expression}\n${await evaluate('document.body.innerText.slice(0,1800)')}\n${errors.join('\n')}`);
    };
    const click = expression => evaluate(`(() => { const target = ${expression}; if (!target) throw Error('Click target missing'); target.click(); return true; })()`);
    const fill = (selector, value) => evaluate(`(() => { const target = document.querySelector(${JSON.stringify(selector)}); if (!target) throw Error('Input missing');
      Object.getOwnPropertyDescriptor(target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(target, ${JSON.stringify(value)});
      target.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    const navigate = async route => {
      await send('Page.navigate', { url: `http://localhost:5173${route}` });
      await waitFor('document.querySelector("#root")?.children.length');
    };
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Network.setBlockedURLs', { urls: ['https://*'] });
    await send('Fetch.enable', { patterns: [{ urlPattern: '*://localhost:5000/api/*' }, { urlPattern: '*://localhost:5173/api/*' }] });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: bootstrap });
    let timeout;
    try {
      await Promise.race([check({ navigate, waitFor, evaluate, click, fill, requests, errors, send }), new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Browser check timed out')), 90000);
      })]);
    } finally { clearTimeout(timeout); }
    assert.deepEqual(errors, []);
    // Chrome may close its debugger socket before acknowledging Browser.close.
    await send('Browser.close').catch(() => {});
  } finally {
    socket?.close(); chrome.kill(); await sleep(500);
    if (path.dirname(path.resolve(profile)) === path.resolve(os.tmpdir()) && path.basename(profile).startsWith('ritomovie-browser-')) {
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch {}
    }
  }
};
