import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phimTitle, phimOverview, phimLabel, phimEpisodeName, phimEpisodeCount } from '../src/utils/phimLocalization.ts';
import { phimToMovieDetails } from '../src/utils/phimFallback.ts';
import { getTranslatedGenre, getTranslatedCountry } from '../src/utils/translations.ts';

const source = {
  name: 'Chiến Binh Ánh Sáng', origin_name: 'Ultraman Teo', content: '<p>Nội dung tiếng Việt</p>',
  category: [{ name: 'Hài', slug: 'hai-huoc' }], country: [{ name: 'Nhật Bản', slug: 'nhat-ban' }],
  time: '24 phút', status: 'ongoing',
};

test('site translations take priority over TMDB and clearing them restores source selection', () => {
  const managed = { ...source, siteOverrides: { titles: { en: 'Site title' }, overviews: { en: 'Site description' } } };
  assert.equal(phimTitle(managed, 'en', { title: 'TMDB title' }), 'Site title');
  assert.equal(phimOverview(managed, 'en', { overview: 'TMDB description' }), 'Site description');
  assert.equal(phimTitle(managed, 'vi'), source.name);
  assert.equal(phimTitle({ ...source, siteOverrides: { titles: { en: '' } } }, 'en', { title: 'TMDB title' }), 'TMDB title');
  assert.equal(phimOverview({ ...source, siteOverrides: { overviews: { en: '' } } }, 'en', { overview: 'TMDB description' }), 'TMDB description');
});

test('canonical TMDB picks prefer the requested language over a captured source snapshot', () => {
  const canonical = { ...source, siteSource: 'tmdb' };
  assert.equal(phimTitle(canonical, 'vi', { title: 'Tên từ TMDB' }), 'Tên từ TMDB');
  assert.equal(phimOverview(canonical, 'vi'), '');
  assert.equal(phimOverview(canonical, 'vi', { overview: 'Mô tả từ TMDB' }), 'Mô tả từ TMDB');
});

test('switching language selects localized metadata without mutating the source', () => {
  assert.equal(phimTitle(source, 'vi-VN', { title: 'English title' }), source.name);
  assert.equal(phimTitle(source, 'en-US', { name: 'English title' }), 'English title');
  assert.equal(phimTitle(source, 'en'), source.origin_name);
  assert.equal(phimTitle({ name: 'Only available title', origin_name: '' }, 'en'), 'Only available title');
  assert.equal(phimTitle(source, 'vi'), source.name);
});

test('English never presents the Vietnamese synopsis as an English translation', () => {
  assert.equal(phimOverview(source, 'en'), '');
  assert.equal(phimOverview(source, 'en', { overview: '  ' }), '');
  assert.equal(phimOverview(source, 'en', { overview: '<p>English synopsis</p>' }), 'English synopsis');
  assert.equal(phimOverview(source, 'vi'), 'Nội dung tiếng Việt');
});

test('localizes episode, progress, runtime and audio labels while retaining their meaning', () => {
  assert.equal(phimLabel('Hoàn Tất (12/12)', 'en'), 'Completed (12/12)');
  assert.equal(phimLabel('Tập 15', 'en-US'), 'Episode 15');
  assert.equal(phimLabel('Phần 2', 'en'), 'Season 2');
  assert.equal(phimLabel('24 phút/tập', 'en'), '24 min/episode');
  assert.equal(phimLabel('Vietsub + Lồng Tiếng (#1)', 'en'), 'Vietnamese subtitles + Vietnamese dubbing (#1)');
  assert.equal(phimLabel('Thuyết Minh', 'en'), 'Vietnamese voice-over');
  assert.equal(phimEpisodeName('01', 'en'), 'Episode 01');
  assert.equal(phimEpisodeName('Tập 2', 'vi'), 'Tập 2');
  assert.equal(phimEpisodeName('Full', 'en'), 'Full');
  assert.equal(phimEpisodeCount('12 Tập', 'en'), '12 Episodes');
  assert.equal(phimEpisodeCount('12', 'vi'), '12 Tập');
});

test('fallback details translate taxonomies and status for regional English locales', () => {
  const english = phimToMovieDetails(source, 0, 'en-US');
  assert.equal(english.title, source.origin_name);
  assert.equal(english.overview, '');
  assert.equal(english.genres[0].name, 'Comedy');
  assert.equal(english.production_countries[0].name, 'Japan');
  assert.equal(english.status, 'Ongoing');
  const vietnamese = phimToMovieDetails(source, 0, 'vi');
  assert.equal(vietnamese.title, source.name);
  assert.equal(vietnamese.genres[0].name, 'Hài');
  assert.equal(source.status, 'ongoing');
  assert.equal(getTranslatedGenre('hành động', 'en'), 'Action');
  assert.equal(getTranslatedCountry('việt nam', 'en-GB'), 'Vietnam');
  assert.equal(getTranslatedGenre('Unknown genre', 'en'), 'Unknown genre');
});
