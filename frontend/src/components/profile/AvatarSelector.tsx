import { useState, useEffect } from 'react';
import { movieService } from '@/services/movieService';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiX, FiSearch } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface Actor {
    id: number;
    name: string;
    profile_path: string | null;
    character?: string;
}

interface AvatarSelectorProps {
    onSelect: (avatarUrl: string) => void;
    onClose: () => void;
    currentAvatar?: string;
}

const AvatarSelector = ({ onSelect, onClose, currentAvatar }: AvatarSelectorProps) => {
    const { t } = useTranslation();
    const [actors, setActors] = useState<Actor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [movieId, setMovieId] = useState<number>(550); // Default: Fight Club

    const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

    // Popular movies for avatar selection
    const popularMovies = [
        { id: 550, name: 'Fight Club' },
        { id: 155, name: 'The Dark Knight' },
        { id: 13, name: 'Forrest Gump' },
        { id: 278, name: 'The Shawshank Redemption' },
        { id: 238, name: 'The Godfather' },
        { id: 680, name: 'Pulp Fiction' },
        { id: 27205, name: 'Inception' },
        { id: 372058, name: 'Your Name' },
        { id: 569094, name: 'Spider-Man: Across the Spider-Verse' },
        { id: 299536, name: 'Avengers: Infinity War' },
    ];

    useEffect(() => {
        fetchActors(movieId);
    }, [movieId]);

    const fetchActors = async (id: number) => {
        setIsLoading(true);
        try {
            const response = await movieService.getCredits(id);
            // Get cast with profile pictures only
            const castWithImages = response.cast
                .filter((actor: Actor) => actor.profile_path)
                .slice(0, 30); // Limit to 30 actors
            setActors(castWithImages);
        } catch (error) {
            console.error('Error fetching actors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAvatar = (profilePath: string) => {
        const avatarUrl = `${TMDB_IMAGE_BASE}${profilePath}`;
        setSelectedAvatar(avatarUrl);
    };

    const handleConfirm = () => {
        if (selectedAvatar) {
            onSelect(selectedAvatar);
            onClose();
        }
    };

    const filteredActors = actors.filter((actor) =>
        actor.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{t('profile.selectAvatar', 'Chọn Avatar')}</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {t('profile.selectAvatarDesc', 'Chọn ảnh từ diễn viên yêu thích của bạn')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Movie Selector */}
                <div className="p-6 border-b border-gray-700">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('profile.chooseMovie', 'Chọn phim:')}
                    </label>
                    <select
                        value={movieId}
                        onChange={(e) => setMovieId(Number(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                    >
                        {popularMovies.map((movie) => (
                            <option key={movie.id} value={movie.id}>
                                {movie.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-gray-700">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('profile.searchActors', 'Tìm kiếm diễn viên...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* Actors Grid */}
                <div className="p-6 overflow-y-auto max-h-[400px]">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : filteredActors.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400">
                                {t('profile.noActorsFound', 'Không tìm thấy diễn viên nào')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                            {filteredActors.map((actor) => {
                                const avatarUrl = `${TMDB_IMAGE_BASE}${actor.profile_path}`;
                                const isSelected = selectedAvatar === avatarUrl;

                                return (
                                    <button
                                        key={actor.id}
                                        onClick={() => handleSelectAvatar(actor.profile_path!)}
                                        className={`group relative aspect-square rounded-lg overflow-hidden transition-all ${isSelected
                                                ? 'ring-4 ring-yellow-500 scale-105'
                                                : 'hover:ring-2 hover:ring-gray-500 hover:scale-105'
                                            }`}
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt={actor.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute bottom-0 left-0 right-0 p-2">
                                                <p className="text-white text-xs font-medium truncate">
                                                    {actor.name}
                                                </p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                                    <span className="text-gray-900 font-bold">✓</span>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedAvatar}
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                        {t('common.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarSelector;
