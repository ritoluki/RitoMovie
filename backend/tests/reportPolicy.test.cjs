const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseReportInput,
  parseReportResolution,
  isReportPath,
} = require('../dist/utils/reportPolicy');
const input = {
  type: 'MOVIE',
  targetId: 'phim:demo-season-2',
  reason: 'PLAYBACK_ERROR',
  description: 'The selected episode does not start.',
};

test('external movie reports preserve only useful context and discard URLs, forged snapshots and privilege fields', () => {
  const result = parseReportInput({
    ...input,
    status: 'RESOLVED',
    priority: 'CRITICAL',
    reporter: 'forged',
    context: {
      movieTitle: 'Demo',
      movieId: 42,
      mediaType: 'tv',
      pagePath: '/watch/demo-season-2?episode=2',
      episode: '2',
      server: 'Source',
      token: 'private',
      link_m3u8: 'https://example.com/private',
      commentText: 'forged',
      authorName: 'forged',
    },
  });
  assert.equal(result.context.movieId, 42);
  assert.equal(result.context.episode, '2');
  assert.equal(result.context.pagePath, '/watch/demo-season-2?episode=2');
  for (const key of ['status', 'priority', 'reporter'])
    assert.equal(result[key], undefined);
  for (const key of ['token', 'link_m3u8', 'commentText', 'authorName'])
    assert.equal(result.context[key], undefined);
  assert.equal(
    parseReportInput({ ...input, targetId: 'tmdb:tv:42' }).targetId,
    'tmdb:tv:42'
  );
});

test('report identifiers, reason/type combinations, notes and local source links reject malformed inputs', () => {
  for (const bad of [
    { ...input, type: '__proto__' },
    { ...input, reason: 'HARASSMENT' },
    { ...input, targetId: { $ne: null } },
    { ...input, description: 'short' },
    { ...input, description: 'x'.repeat(1001) },
    { ...input, type: 'COMMENT', targetId: 'phim:demo' },
    { ...input, targetId: 'https://example.com' },
    { ...input, type: 'BUG', targetId: '//example.com', reason: 'BUG_REPORT' },
  ])
    assert.throws(
      () => parseReportInput(bad),
      (error) => error.statusCode === 400
    );
  for (const link of [
    '//example.com',
    'https://example.com',
    '/watch/\\example.com',
    '/admin/users',
    '/watch/demo\n',
  ]) {
    assert.equal(isReportPath(link), false);
    assert.equal(
      parseReportInput({ ...input, context: { pagePath: link } }).context
        .pagePath,
      undefined
    );
  }
  assert.throws(
    () => parseReportResolution('x'),
    (error) => error.statusCode === 400
  );
  assert.throws(
    () => parseReportResolution('x'.repeat(501)),
    (error) => error.statusCode === 400
  );
  assert.equal(
    parseReportResolution('  Reviewed and resolved.  '),
    'Reviewed and resolved.'
  );
});
