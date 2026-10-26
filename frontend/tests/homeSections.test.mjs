import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homeSectionsFrom } from '../src/utils/homeSections.ts';

test('configured order is authoritative, including an intentionally empty home', () => {
  assert.deepEqual(homeSectionsFrom({ homeSections: [], trending: { results: [{ id: 1 }] } }), []);
  const configured = [{ id: 'top-rated', items: [{ id: 2 }] }, { id: 'trending', items: [{ id: 1 }] }];
  assert.equal(homeSectionsFrom({ homeSections: configured }), configured);
});

test('older API responses retain existing sections and limits during independent deployments', () => {
  const movies = Array.from({ length: 20 }, (_, index) => ({ id: index + 1 }));
  const data = { trending: { results: movies }, popular: { results: movies }, managed: { featured: { items: [{ slug: 'featured' }] } } };
  const sections = homeSectionsFrom(data);
  assert.equal(sections.find(section => section.id === 'hero').items.length, 5);
  assert.equal(sections.find(section => section.id === 'trending').items.length, 10);
  assert.equal(sections.find(section => section.id === 'featured').items[0].slug, 'featured');
  assert.equal(movies.length, 20);
});
