import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phimToMovieDetails, phimActorNames, selectPhimImages } from '../src/utils/phimFallback.ts';

test('renders PhimAPI details without TMDB, normalizes images and strips HTML', () => {
  const movie = phimToMovieDetails({ name: 'Tên phim', origin_name: 'Title', content: '<p>Xin&nbsp;chào</p><b>Thế giới</b>',
    thumb_url: '/poster.jpg', poster_url: 'https://cdn.example.com/backdrop.jpg', year: 2024,
    category: [{ name: 'Hài' }], country: [{ name: 'Việt Nam' }], time: '105 phút' }, 0);
  assert.equal(movie.id, 0);
  assert.equal(movie.title, 'Tên phim');
  assert.equal(movie.overview, 'Xin chào Thế giới');
  assert.equal(movie.poster_path, 'https://phimimg.com/poster.jpg');
  assert.equal(movie.backdrop_path, 'https://cdn.example.com/backdrop.jpg');
  assert.equal(movie.runtime, 105);
  assert.equal(movie.release_date, '2024-01-01');
});

test('uses supplemental images only where TMDB has no images', () => {
  const primary = { backdrops: ['/tmdb.jpg'], posters: [] };
  const fallback = { backdrops: ['/other.jpg'], posters: ['/poster.jpg'] };
  assert.deepEqual(selectPhimImages(primary, fallback), { backdrops: ['/tmdb.jpg'], posters: ['/poster.jpg'] });
  assert.equal(selectPhimImages(undefined, fallback), fallback);
});

test('actor names remain available when detailed cast is empty', () => {
  assert.equal(phimActorNames(['Actor'])[0].name, 'Actor');
  assert.deepEqual(phimActorNames(), []);
});
