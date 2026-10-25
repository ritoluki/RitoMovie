const { test } = require('node:test');
const assert = require('node:assert/strict');
const { uniqueCandidates, rankRecommendation, hasPlayableEpisodes, mapConcurrent, mediaTypeOf } = require('../dist/utils/recommendationRanking');

const source = { slug: 'current', name: 'Current', year: 2024, tmdb: { type: 'movie', id: '1' },
  category: [{ slug: 'hanh-dong' }], country: [{ slug: 'han-quoc' }] };

test('excludes the current film, duplicate TMDB titles and the wrong media type', () => {
  const candidates = [source, { ...source, slug: 'current-alias' },
    { slug: 'a', name: 'A', tmdb: { type: 'movie', id: '2' } },
    { slug: 'a-alias', name: 'A alias', tmdb: { type: 'movie', id: 2 } },
    { slug: 'tv', name: 'TV', type: 'series', tmdb: { type: 'tv', id: '3' } }];
  assert.deepEqual(uniqueCandidates(candidates, source, 'movie').map(item => item.slug), ['a']);
});

test('different seasons of the same series are not repeated', () => {
  const series = { slug: 'season-1', name: 'Series', tmdb: { type: 'tv', id: '2' } };
  assert.deepEqual(uniqueCandidates([{ ...series, slug: 'season-2' }], series, 'tv'), []);
});

test('animated series without TMDB metadata are identified using actual episode data', () => {
  assert.equal(mediaTypeOf({ type: 'hoathinh', episode_current: 'Tập 119' }), 'tv');
  assert.equal(mediaTypeOf({ type: 'hoathinh', episode_current: 'Hoàn Tất', episode_total: '12' }), 'tv');
  assert.equal(mediaTypeOf({ type: 'hoathinh', episode_current: 'Full', episode_total: '1' }), 'movie');
});

test('shared genre ranks higher than country alone; keyword overlap improves relevance', () => {
  const genre = { slug: 'action', name: 'Action', category: source.category };
  const country = { slug: 'country', name: 'Country', country: source.country };
  assert.ok(rankRecommendation(source, genre).score > rankRecommendation(source, country).score);
  const related = rankRecommendation(source, genre, undefined, ['Vũ trụ', 'time travel'], ['vu tru']);
  assert.ok(related.score > rankRecommendation(source, genre).score);
  assert.equal(related.reason, 'keywords');
});

test('TMDB recommendations receive relevance credit while preserving real metadata', () => {
  const candidate = { slug: 'recommended', name: 'Recommended', episode_current: 'Tập 3', quality: 'HD' };
  assert.ok(rankRecommendation(source, candidate, 0).score > rankRecommendation(source, candidate).score);
  assert.equal(candidate.episode_current, 'Tập 3');
});

test('playability requires at least one HTTP(S) HLS or embed link', () => {
  assert.equal(hasPlayableEpisodes({ episodes: [] }), false);
  assert.equal(hasPlayableEpisodes({ episodes: [{ server_data: [{ link_m3u8: '' }] }] }), false);
  assert.equal(hasPlayableEpisodes({ episodes: [{ server_data: [{ link_embed: 'javascript:alert(1)' }] }] }), false);
  assert.equal(hasPlayableEpisodes({ episodes: [{ server_data: [{ link_m3u8: 'https://cdn.example.com/movie.m3u8' }] }] }), true);
  assert.equal(hasPlayableEpisodes({ episodes: [{ server_data: [{ link_embed: 'https://player.example.com/movie' }] }] }), true);
});

test('verification limits simultaneous requests and preserves input order', async () => {
  let active = 0, peak = 0;
  const results = await mapConcurrent([1, 2, 3, 4, 5], 2, async value => {
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setTimeout(resolve, 10));
    active--;
    return value * 2;
  });
  assert.equal(peak, 2);
  assert.deepEqual(results, [2, 4, 6, 8, 10]);
});
