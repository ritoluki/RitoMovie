import { useState } from 'react';
import Comments from '../Comments';

interface EpisodesTabProps {
  movieId: number;
  movieTitle: string;
}

const EpisodesTab = ({ movieId, movieTitle }: EpisodesTabProps) => {
  const [selectedSeason, setSelectedSeason] = useState('1');
  const [selectedFilter, setSelectedFilter] = useState<'subtitle' | 'dub'>('subtitle');
  const [isCompact, setIsCompact] = useState(false);

  // Generate mock episodes (can be customized based on movie data)
  const totalEpisodes = 8;
  const episodes = Array.from({ length: totalEpisodes }, (_, i) => ({
    number: i + 1,
    title: `Tập ${i + 1}`,
    isWatched: false,
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Season Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-yellow-400 cursor-pointer"
          >
            <option value="1">Phần 1</option>
            <option value="2">Phần 2</option>
            <option value="3">Phần 3</option>
          </select>
        </div>

        {/* Filter Buttons */}
        <button
          onClick={() => setSelectedFilter('subtitle')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'subtitle'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          Phụ đề
        </button>

        <button
          onClick={() => setSelectedFilter('dub')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'dub'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          Thuyết minh giọng Nam
        </button>

        {/* Compact Toggle */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-gray-400 text-sm">Rút gọn</span>
          <button
            onClick={() => setIsCompact(!isCompact)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isCompact ? 'bg-red-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isCompact ? 'translate-x-6' : 'translate-x-1'
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
              Tập {episode.number}
            </span>
            {episode.isWatched && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Comments Section */}
      <div className="pt-8 border-t border-gray-800">
        <Comments movieId={movieId} />
      </div>
    </div>
  );
};

export default EpisodesTab;

