import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { isChunkLoadError, reloadAfterChunkError } from '../src/lib/chunkRecovery.ts';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else delete globalThis.window;
});

function browser({ online = true, storage = new Map() } = {}) {
  let reloads = 0;
  const runtime = {
    navigator: { onLine: online },
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    location: { reload: () => reloads++ },
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: runtime });
  return { runtime, storage, reloads: () => reloads };
}

test('reloads once and retains the guard across page reloads', () => {
  const firstPage = browser();
  assert.equal(reloadAfterChunkError(), true);
  assert.equal(reloadAfterChunkError(), false);
  assert.equal(firstPage.reloads(), 1);

  const nextPage = browser({ storage: firstPage.storage });
  assert.equal(reloadAfterChunkError(), false);
  assert.equal(nextPage.reloads(), 0);
});

test('does not reload or consume the attempt while offline', () => {
  const page = browser({ online: false });
  assert.equal(reloadAfterChunkError(), false);
  assert.equal(page.storage.size, 0);
  page.runtime.navigator.onLine = true;
  assert.equal(reloadAfterChunkError(), true);
});

test('does not risk a reload loop when session storage is blocked', () => {
  const page = browser();
  page.runtime.sessionStorage.setItem = () => { throw new Error('Storage blocked'); };
  assert.equal(reloadAfterChunkError(), false);
  assert.equal(page.reloads(), 0);
});

test('permits recovery from a later deployment after the cooldown', () => {
  const page = browser();
  assert.equal(reloadAfterChunkError(), true);
  for (const key of page.storage.keys()) page.storage.set(key, String(Date.now() - 61_000));
  assert.equal(reloadAfterChunkError(), true);
  assert.equal(page.reloads(), 2);
});

test('identifies browser chunk failures without classifying unrelated errors', () => {
  for (const message of [
    'Failed to fetch dynamically imported module: https://example.com/assets/Watch.js',
    'error loading dynamically imported module: https://example.com/Watch.js',
    'Importing a module script failed.',
    'Loading chunk 42 failed.',
    'Unable to preload CSS for /assets/Watch.css',
  ]) assert.equal(isChunkLoadError(new TypeError(message)), true);
  assert.equal(isChunkLoadError(new Error('Failed to fetch movies')), false);
  assert.equal(isChunkLoadError(null), false);
});
