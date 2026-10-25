const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ensurePhimSuccess, unwrapPhimData, normalizePhimExtras, normalizePhimTaxonomy, parsePhimYear } = require('../dist/utils/phimPayload');

test('category and country lists support both legacy arrays and actual nested API responses', () => {
  const items = [{ _id: '123', name: 'Hành Động', slug: 'hanh-dong' }];
  for (const response of [items, { items }, { status: 'success', data: { items } }]) {
    assert.deepEqual(normalizePhimTaxonomy(response), items);
  }
  assert.deepEqual(normalizePhimTaxonomy({ status: 'success', data: { items: [] } }), []);
  assert.throws(() => normalizePhimTaxonomy({ status: 'success', data: {} }), { statusCode: 502 });
  assert.throws(() => normalizePhimTaxonomy({ status: 'error', message: 'Unavailable' }), { statusCode: 502 });
});

test('accepts classic, catalog and supplemental API response envelopes', () => {
  assert.deepEqual(unwrapPhimData({ status: true, items: [1] }).items, [1]);
  assert.deepEqual(unwrapPhimData({ status: 'success', data: { items: [2] } }).items, [2]);
  assert.deepEqual(unwrapPhimData({ success: true, data: { images: [] } }).images, []);
  for (const payload of [null, { status: false }, { status: 'error' }, { success: false }]) {
    assert.throws(() => ensurePhimSuccess(payload), { statusCode: 502 });
  }
});

test('separates images and normalizes localized, duplicated keywords', () => {
  const extras = normalizePhimExtras(
    { data: { tmdb_id: 42, images: [
      { type: 'backdrop', file_path: '/wide.jpg' }, { type: 'poster', file_path: '/portrait.jpg' },
      { type: 'poster' },
    ] } },
    { data: { peoples: [{ name: 'Actor', character: 'Pilot', profile_path: '/actor.jpg' }] } },
    { data: { keywords: [{ name: 'space', name_vn: 'Vũ trụ' }, 'Vũ trụ', {}] } },
  );
  assert.equal(extras.images.backdrops.length, 1);
  assert.equal(extras.images.posters.length, 1);
  assert.equal(extras.cast[0].character, 'Pilot');
  assert.deepEqual(extras.keywords, ['Vũ trụ']);
});

test('missing supplemental endpoints produce empty data instead of crashing', () => {
  const extras = normalizePhimExtras({}, {}, {});
  assert.deepEqual(extras.images.backdrops, []);
  assert.deepEqual(extras.cast, []);
  assert.deepEqual(extras.keywords, []);
});

test('validates single years and ranges without silently discarding invalid input', () => {
  assert.equal(parsePhimYear('2024'), '2024');
  assert.equal(parsePhimYear('2014,2024'), '2014,2024');
  assert.equal(parsePhimYear(undefined), undefined);
  for (const year of ['2024,2014', '2024,', ',2024', '2024abc', '1700', '2020,2022,2024']) {
    assert.throws(() => parsePhimYear(year), { statusCode: 400 });
  }
});
