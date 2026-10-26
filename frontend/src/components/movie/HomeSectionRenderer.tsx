import { useTranslation } from 'react-i18next';
import type { Movie, PhimMovieSummary } from '@/types';
import type { HomeSection } from '@/utils/homeSections';
import { useLazyLoadSection } from '@/hooks/useLazyLoadSection';
import SkeletonMovieRow from '@/components/common/SkeletonMovieRow';
import HeroBanner from './HeroBanner';
import MovieRow from './MovieRow';
import PhimRow from './PhimRow';
import TopMoviesSection from './TopMoviesSection';
import TopMoviesTiltedSection from './TopMoviesTiltedSection';

export default function HomeSectionRenderer({ section, immediate }: { section: HomeSection; immediate: boolean }) {
  const { t, i18n } = useTranslation();
  const lazy = useLazyLoadSection({ loadImmediately: immediate || section.kind === 'hero', rootMargin: '300px' });
  const title = t(section.titleKey, { defaultValue: section.title[i18n.language.startsWith('vi') ? 'vi' : 'en'] });
  let content;
  if (!lazy.shouldLoad) content = <SkeletonMovieRow />;
  else if (section.kind === 'hero') content = <HeroBanner movies={section.items as Movie[]} />;
  else if (section.kind === 'phim') content = <PhimRow title={title} items={section.items as PhimMovieSummary[]} link={section.link} />;
  else if (section.kind === 'top') content = <TopMoviesSection title={title} movies={section.items as Movie[]} />;
  else if (section.kind === 'tilted') content = <TopMoviesTiltedSection title={title} movies={section.items as Movie[]} />;
  else content = <MovieRow title={title} movies={section.items as Movie[]} link={section.link} />;
  return <section ref={lazy.sectionRef} data-home-section={section.id}>{content}</section>;
}
