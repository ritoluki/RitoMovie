import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
  notificationTarget,
  notificationText,
  parseNotificationFrame,
  consumeNotificationStream,
  notificationDirectTarget,
  notificationRelatedQueries,
} from '../src/lib/notifications.ts';

test('reply and admin report notifications navigate directly; account/report outcome notifications open details', () => {
  const target = `/movie/42?phimSlug=season#comment-${'a'.repeat(24)}`;
  assert.equal(
    notificationDirectTarget({ type: 'COMMENT_REPLY', target }),
    target,
  );
  assert.equal(
    notificationDirectTarget({
      type: 'ADMIN_REPORT',
      target: '/admin/reports?report=123',
    }),
    '/admin/reports?report=123',
  );
  for (const type of [
    'COMMENT_RESTRICTED',
    'COMMENT_RESTRICTION_LIFTED',
    'REPORT_RESOLVED',
    'REPORT_REJECTED',
  ]) {
    assert.equal(
      notificationDirectTarget({ type, target: '/profile' }),
      undefined,
    );
  }
  assert.equal(
    notificationDirectTarget({
      type: 'COMMENT_REPLY',
      target: 'https://example.com',
    }),
    undefined,
  );
});

test('opening a reply notification refreshes an existing empty reply cache, including an already read notification on the same URL', async () => {
  const rootId = 'b'.repeat(24);
  const item = {
    type: 'COMMENT_REPLY',
    target: `/movie/42#comment-${rootId}`,
    readAt: '2026-10-01T00:00:00Z',
  };
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  });
  let replies = [];
  const queryKey = ['replies', rootId];
  const queryFn = async () => [...replies];
  await client.fetchQuery({ queryKey, queryFn });
  client.setQueryData(['replies', 'unrelated-thread'], ['unchanged']);
  client.setQueryData(['comments', 42], []);
  client.setQueryData(['comment-thread', rootId], { repliesCount: 0 });
  const observer = new QueryObserver(client, { queryKey, queryFn });
  const unsubscribe = observer.subscribe(() => {});
  replies = ['new reply'];
  for (const key of notificationRelatedQueries(item))
    await client.invalidateQueries({ queryKey: key, refetchType: 'active' });
  assert.deepEqual(client.getQueryData(queryKey), ['new reply']);
  assert.equal(
    client.getQueryState(['comment-thread', rootId]).isInvalidated,
    true,
  );
  assert.equal(client.getQueryState(['comments', 42]).isInvalidated, true);
  assert.equal(
    client.getQueryState(['replies', 'unrelated-thread']).isInvalidated,
    false,
  );
  replies.push('another reply');
  for (const key of notificationRelatedQueries(item))
    await client.invalidateQueries({ queryKey: key, refetchType: 'active' });
  assert.equal(client.getQueryData(queryKey).length, 2);
  unsubscribe();
  client.clear();
});

test('notification links only route to supported local destinations', () => {
  for (const target of [
    '/profile',
    '/notifications',
    '/movie/42?phimSlug=season#comment-123',
    '/watch/season?episode=2',
    '/admin/reports?report=123',
  ])
    assert.equal(notificationTarget(target), target);
  for (const target of [
    'https://example.com',
    '//example.com',
    '/\\example.com',
    'javascript:alert(1)',
    '/profile-other',
    '/admin/users',
    '/watch/demo\n',
  ])
    assert.equal(notificationTarget(target), '/notifications');
});

test('notification metadata accepts only known kinds and valid identifiers', () => {
  assert.deepEqual(parseNotificationFrame('event: ready\ndata: {}'), {
    type: 'ready',
  });
  assert.deepEqual(
    parseNotificationFrame('event: change\ndata: {"kind":"read"}'),
    { type: 'change', kind: 'read' },
  );
  const id = 'a'.repeat(24);
  assert.deepEqual(
    parseNotificationFrame(
      `event: change\ndata: {"kind":"created","id":"${id}","recipient":"ignored"}`,
    ),
    { type: 'change', kind: 'created', id },
  );
  for (const frame of [
    ': heartbeat',
    'event: unknown\ndata: {}',
    'event: change\ndata: {"kind":"created","id":"bad"}',
    'event: change\ndata: invalid',
  ])
    assert.equal(parseNotificationFrame(frame), undefined);
});

test('the user notification channel uses its own parser and the same authenticated cancellable transport', async () => {
  const id = 'b'.repeat(24);
  const events = [];
  await consumeNotificationStream({
    url: '/api/notifications/events',
    token: 'fixture',
    signal: new AbortController().signal,
    onEvent: (event) => events.push(event),
    onActivity: () => {},
    request: async (url, options) => {
      assert.equal(url, '/api/notifications/events');
      assert.equal(options.headers.Authorization, 'Bearer fixture');
      return new Response(
        `event: ready\ndata: {}\n\nevent: change\ndata: {"kind":"created","id":"${id}"}\n\n`,
        { headers: { 'Content-Type': 'text/event-stream' } },
      );
    },
  });
  assert.equal(events[1].id, id);
});

test('all notification types have English and Vietnamese templates without broken Vietnamese encoding', () => {
  for (const locale of ['en', 'vi']) {
    const dictionary = JSON.parse(
      fs.readFileSync(
        new URL(
          `../public/locales/${locale}/translation.json`,
          import.meta.url,
        ),
        'utf8',
      ),
    );
    const translate = (key, params = {}) => {
      const template = key
        .split('.')
        .reduce((object, part) => object?.[part], dictionary);
      assert.equal(typeof template, 'string', `Missing ${locale} ${key}`);
      return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
        String(params[key] || ''),
      );
    };
    for (const type of [
      'COMMENT_REPLY',
      'COMMENT_RESTRICTED',
      'COMMENT_RESTRICTION_LIFTED',
      'REPORT_RESOLVED',
      'REPORT_REJECTED',
      'ADMIN_REPORT',
    ]) {
      const text = notificationText(
        {
          type,
          data: { actorName: 'Alice', reason: 'Spam', reportType: 'COMMENT' },
        },
        translate,
      );
      assert.ok(text.title && text.body);
      assert.equal(/[A-Za-z]\?[A-Za-z]/.test(text.title + text.body), false);
    }
  }
});
