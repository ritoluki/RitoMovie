import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
  parseAdminEvent,
  adminQueryKeys,
  consumeAdminStream,
  AdminStreamError,
} from '../src/lib/adminRealtime.ts';

const streamResponse = (text, fragmentSize = 7) => {
  const bytes = new TextEncoder().encode(text);
  return new Response(
    new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += fragmentSize)
          controller.enqueue(bytes.slice(i, i + fragmentSize));
        controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } },
  );
};

test('admin messages admit only supported event types and cache topics', () => {
  assert.deepEqual(
    parseAdminEvent(
      'event: change\ndata: {"topics":["reports","reports","__proto__","anything",42]}',
    ),
    { type: 'change', topics: ['reports'] },
  );
  assert.equal(parseAdminEvent(': heartbeat'), undefined);
  assert.equal(parseAdminEvent('event: change\ndata: invalid'), undefined);
  assert.equal(
    parseAdminEvent('event: change\ndata: {"topics":"reports"}'),
    undefined,
  );
  assert.equal(
    parseAdminEvent('event: unknown\ndata: {"topics":["users"]}'),
    undefined,
  );
  assert.deepEqual(adminQueryKeys(['users', 'reports']), [
    ['admin', 'users'],
    ['admin', 'reports'],
    ['admin', 'user'],
  ]);
});

test('stream authentication uses a header and fragmented UTF-8, CRLF and heartbeats preserve complete events', async () => {
  const events = [];
  let activity = 0;
  const controller = new AbortController();
  await consumeAdminStream({
    url: '/api/admin/events',
    token: 'test-token-only',
    signal: controller.signal,
    onEvent: (event) => events.push(event),
    onActivity: () => activity++,
    request: async (url, options) => {
      assert.equal(url, '/api/admin/events');
      assert.equal(options.headers.Authorization, 'Bearer test-token-only');
      assert.equal(options.signal, controller.signal);
      return streamResponse(
        'event: ready\r\ndata: {"topics":["reports"],"ignored":"cập nhật"}\r\n\r\n: heartbeat\r\n\r\nevent: change\r\ndata: {"topics":["reports","dashboard"]}\r\n\r\n',
        1,
      );
    },
  });
  assert.deepEqual(events, [
    { type: 'ready', topics: ['reports'] },
    { type: 'change', topics: ['reports', 'dashboard'] },
  ]);
  assert.ok(activity > 10);
});

test('a change or reconnect refreshes active report rows and totals without refetching unrelated settings', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  let rows = [];
  let calls = 0;
  const queryKey = ['admin', 'reports', { status: 'PENDING', page: 1 }];
  const queryFn = async () => {
    calls++;
    return { data: [...rows], total: rows.length };
  };
  await client.fetchQuery({ queryKey, queryFn });
  client.setQueryData(['admin', 'settings'], { unsavedDraft: 'unchanged' });
  const observer = new QueryObserver(client, {
    queryKey,
    queryFn,
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(() => {});
  const refresh = async (type) => {
    const requests = [];
    await consumeAdminStream({
      url: '/api/admin/events',
      token: 'fixture',
      signal: new AbortController().signal,
      onEvent: (event) =>
        adminQueryKeys(event.topics).forEach((key) =>
          requests.push(
            client.invalidateQueries({ queryKey: key, refetchType: 'active' }),
          ),
        ),
      onActivity: () => {},
      request: async () =>
        streamResponse(`event: ${type}\ndata: {"topics":["reports"]}\n\n`),
    });
    await Promise.all(requests);
  };
  rows = [{ _id: 'new-report' }];
  await refresh('change');
  assert.equal(client.getQueryData(queryKey).total, 1);
  rows.push({ _id: 'created-while-offline' });
  await refresh('ready');
  assert.equal(client.getQueryData(queryKey).total, 2);
  assert.equal(calls, 3);
  assert.deepEqual(client.getQueryData(['admin', 'settings']), {
    unsavedDraft: 'unchanged',
  });
  unsubscribe();
  client.clear();
});

test('aborting a subscription cancels its reader rather than leaving an open request', async () => {
  const controller = new AbortController();
  let cancelled = false;
  await consumeAdminStream({
    url: '/api/admin/events',
    token: 'fixture',
    signal: controller.signal,
    onActivity: () => {},
    onEvent: () => controller.abort(),
    request: async () =>
      new Response(
        new ReadableStream({
          start(stream) {
            stream.enqueue(
              new TextEncoder().encode(
                'event: ready\ndata: {"topics":["reports"]}\n\n',
              ),
            );
          },
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
      ),
  });
  assert.equal(cancelled, true);
});

test('HTTP errors, non-stream responses and oversized frames fail without keeping response bodies open', async () => {
  const options = {
    url: '/api/admin/events',
    token: 'fixture',
    signal: new AbortController().signal,
    onActivity: () => {},
    onEvent: () => {},
  };
  await assert.rejects(
    consumeAdminStream({
      ...options,
      request: async () => new Response('{}', { status: 403 }),
    }),
    (error) => error instanceof AdminStreamError && error.status === 403,
  );
  await assert.rejects(
    consumeAdminStream({
      ...options,
      request: async () => new Response('<html>'),
    }),
    /Invalid admin event stream/,
  );
  await assert.rejects(
    consumeAdminStream({
      ...options,
      request: async () =>
        streamResponse(
          `event: change\ndata: ${'x'.repeat(70_000)}\n\n`,
          80_000,
        ),
    }),
    /too large/,
  );
});
