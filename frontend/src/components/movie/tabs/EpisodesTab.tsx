import { useState } from 'react';
import Comments from '../Comments';
import Dropdown from '@/components/common/Dropdown';
import Button from '@/components/common/Button';
import { useTranslation } from 'react-i18next';

interface EpisodesTabProps {
  movieId: number;
  movieTitle: string;
}

const EpisodesTab = ({ movieId, movieTitle }: EpisodesTabProps) => {
  const { t } = useTranslation();
  const [selectedSeason, setSelectedSeason] = useState('1');
  const [selectedFilter, setSelectedFilter] = useState<'subtitle' | 'dub'>('subtitle');
  const [isCompact, setIsCompact] = useState(false);

  // Generate mock episodes (can be customized based on movie data)
  const totalEpisodes = 8;
  const episodes = Array.from({ length: totalEpisodes }, (_, i) => ({
    number: i + 1,
    title: `${t('movie.episode')} ${i + 1}`,
    isWatched: false,
  }));

  // Prepare season options
  const seasonOptions = [
    { value: '1', label: `${t('movie.season')} 1` },
    { value: '2', label: `${t('movie.season')} 2` },
    { value: '3', label: `${t('movie.season')} 3` },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Season Dropdown */}
        <div className="w-36">
          <Dropdown
            value={selectedSeason}
            onChange={setSelectedSeason}
            options={seasonOptions}
          />
        </div>

        {/* Filter Buttons */}
        <Button
          onClick={() => setSelectedFilter('subtitle')}
          variant={selectedFilter === 'subtitle' ? 'danger' : 'outline'}
          size="sm"
        >
          {t('movie.subtitle')}
        </Button>

        <Button
          onClick={() => setSelectedFilter('dub')}
          variant={selectedFilter === 'dub' ? 'primary' : 'outline'}
          size="sm"
          className={selectedFilter === 'dub' ? 'bg-purple-600 hover:bg-purple-700' : ''}
        >
          {t('movie.dubbed')}
        </Button>

        {/* Compact Toggle */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-gray-400 text-sm">{t('movie.compact')}</span>
          <button
            onClick={() => setIsCompact(!isCompact)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCompact ? 'bg-red-600' : 'bg-gray-700'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCompact ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Episodes Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
        {episodes.map((episode) => (
          <button
            key={episode.number}
            className="group relative bg-gray-800 hover:bg-red-600 rounded-lg px-4 py-3 transition-all duration-200 border border-gray-700 hover:border-red-500"
          >
            <span className="text-white text-sm font-medium">
              {episode.title}
            </span>
            {episode.isWatched && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Comments Section */}
      <div className="pt-8 border-t border-gray-800" data-comments-section>
        <Comments movieId={movieId} />
      </div>
    </div>
  );
};

export default EpisodesTab;

