import { Cast } from '@/types';
import { getImageUrl } from '@/utils/helpers';
import Comments from '../Comments';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface CastTabProps {
  movieId: number;
  cast: Cast[];
  isLoading?: boolean;
}

const CastTab = ({ movieId, cast, isLoading }: CastTabProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!cast || cast.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Không có thông tin diễn viên</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cast Grid */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Diễn viên</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cast.map((person) => (
            <div
              key={person.id}
              className="group cursor-pointer"
            >
              {/* Profile Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 mb-3">
                <img
                  src={getImageUrl(person.profile_path, 'profile', 'medium')}
                  alt={person.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Info */}
              <div className="text-center">
                <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                  {person.name}
                </h4>
                <p className="text-gray-400 text-xs line-clamp-1">
                  {person.character}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="pt-8 border-t border-gray-800">
        <Comments movieId={movieId} />
      </div>
    </div>
  );
};

export default CastTab;

