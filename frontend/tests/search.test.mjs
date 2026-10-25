import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearch } from '../src/utils/search.ts';

test('unaccented searches match Vietnamese names including uppercase Đ', () => {
  assert.ok(normalizeSearch('Hành Động').includes(normalizeSearch('hanh dong')));
  assert.ok(normalizeSearch('Đan Mạch').includes(normalizeSearch('dan mach')));
  assert.ok(normalizeSearch('Ấn Độ').includes(normalizeSearch('an do')));
});
test('search tolerates case, surrounding whitespace and composed accents', () => {
  assert.equal(normalizeSearch('  HÀN QUỐC '), 'han quoc');
  assert.equal(normalizeSearch('Việt Nam'.normalize('NFD')), normalizeSearch('Việt Nam'));
});
