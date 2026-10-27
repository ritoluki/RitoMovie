import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdminRealtimeConnection } from '../src/lib/adminRealtimeConnection.ts';
import { AdminStreamError } from '../src/lib/adminRealtime.ts';

const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
const setup = (t, customConsume) => {
  t.mock.timers.enable({
    apis: ['setTimeout', 'setInterval', 'Date'],
    now: 1000,
  });
  const attempts = [];
  const statuses = [];
  const topics = [];
  let refreshes = 0;
  const connection = createAdminRealtimeConnection({
    url: '/api/admin/events',
    token: 'fixture',
    onStatus: (status) => statuses.push(status),
    onTopics: (next) => topics.push(next),
    onRefresh: () => refreshes++,
    consume:
      customConsume ||
      ((options) =>
        new Promise((resolve) => {
          attempts.push({ ...options, finish: resolve });
          options.signal.addEventListener('abort', () => resolve(), {
            once: true,
          });
        })),
  });
  t.after(() => connection.stop());
  return {
    connection,
    attempts,
    statuses,
    topics,
    get refreshes() {
      return refreshes;
    },
  };
};

test('connection recovers after a disconnect and refreshes missed changes; paused and stopped views create no new subscriptions', async (t) => {
  const fixture = setup(t);
  fixture.connection.resume();
  const first = fixture.attempts[0];
  first.onActivity();
  first.onEvent({ type: 'ready', topics: ['reports'] });
  first.onEvent({ type: 'change', topics: ['reports', 'dashboard'] });
  assert.equal(fixture.statuses.at(-1), 'live');
  first.finish();
  await flush();
  assert.equal(fixture.statuses.at(-1), 'reconnecting');
  t.mock.timers.tick(1000);
  assert.equal(fixture.attempts.length, 2);
  const second = fixture.attempts[1];
  second.onActivity();
  second.onEvent({ type: 'ready', topics: ['reports', 'dashboard'] });
  assert.deepEqual(fixture.topics.at(-1), ['reports', 'dashboard']);
  fixture.connection.pause();
  assert.equal(second.signal.aborted, true);
  await flush();
  t.mock.timers.tick(120_000);
  assert.equal(fixture.attempts.length, 2);
  assert.equal(fixture.refreshes, 1);
  fixture.connection.resume();
  assert.equal(fixture.attempts.length, 3);
  assert.equal(fixture.refreshes, 2);
  fixture.connection.stop();
  assert.equal(fixture.attempts[2].signal.aborted, true);
  await flush();
  t.mock.timers.tick(120_000);
  assert.equal(fixture.attempts.length, 3);
});

test('an unavailable stream falls back to periodic refresh and does not keep polling while the tab is paused', async (t) => {
  let attempts = 0;
  const fixture = setup(t, async () => {
    attempts++;
    throw new Error('Offline');
  });
  fixture.connection.resume();
  await flush();
  t.mock.timers.tick(30_000);
  await flush();
  assert.equal(fixture.refreshes, 2);
  assert.ok(attempts >= 2);
  fixture.connection.pause();
  await flush();
  t.mock.timers.tick(120_000);
  await flush();
  assert.equal(fixture.refreshes, 2);
});

test('authorization failure triggers a normal data check without repeatedly reconnecting an invalid session', async (t) => {
  let attempts = 0;
  const fixture = setup(t, async () => {
    attempts++;
    throw new AdminStreamError(401);
  });
  fixture.connection.resume();
  await flush();
  assert.equal(fixture.refreshes, 2);
  t.mock.timers.tick(120_000);
  await flush();
  assert.equal(attempts, 1);
  assert.equal(fixture.refreshes, 2);
});

test('a connection with missing heartbeats is replaced instead of staying live forever', async (t) => {
  const fixture = setup(t);
  fixture.connection.resume();
  const first = fixture.attempts[0];
  first.onActivity();
  first.onEvent({ type: 'ready', topics: ['reports'] });
  t.mock.timers.tick(60_000);
  await flush();
  assert.equal(first.signal.aborted, true);
  assert.equal(fixture.attempts.length, 2);
  assert.equal(fixture.statuses.at(-1), 'reconnecting');
});
