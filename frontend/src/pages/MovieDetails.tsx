import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiDownload, FiHeart, FiShare2, FiMessageCircle } from 'react-icons/fi';
import { AiFillHeart } from 'react-icons/ai';
import { IoPlay } from 'react-icons/io5';
import { useMovies } from '@/hooks/useMovies';
import { useAuthStore } from '@/store/authStore';
import { useMovieStore } from '@/store/movieStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';
import { getImageUrl } from '@/utils/helpers';
import { motion } from 'framer-motion';
import EpisodesTab from '@/components/movie/tabs/EpisodesTab';
import CastTab from '@/components/movie/tabs/CastTab';
import GalleryTab from '@/components/movie/tabs/GalleryTab';
import RecommendationsTab from '@/components/movie/tabs/RecommendationsTab';

type TabType = 'episodes' | 'gallery' | 'cast' | 'recommendations';

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0');
  const [activeTab, setActiveTab] = useState<TabType>('episodes');

  const { useMovieDetails, useMovieCredits, useSimilarMovies, useMovieImages } = useMovies();

  const { data: movie, isLoading: movieLoading } = useMovieDetails(movieId);
  const { data: credits } = useMovieCredits(movieId);
  const { data: similar } = useSimilarMovies(movieId);
  const { data: images } = useMovieImages(movieId);

  const { isAuthenticated } = useAuthStore();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useMovieStore();

  const inWatchlist = isInWatchlist(movieId);

  const handleWatchlistClick = async () => {
    if (!isAuthenticated) return;

    try {
      if (inWatchlist) {
        await removeFromWatchlist(movieId);
      } else {
        await addToWatchlist(movieId);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie?.title,
        text: movie?.overview,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleScrollToComments = () => {
    // Scroll to episodes tab (where comments are) and switch to that tab
    setActiveTab('episodes');
    // Wait for tab content to render, then scroll to comments
    setTimeout(() => {
      const commentsSection = document.querySelector('[data-comments-section]');
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDownload = () => {
    // Placeholder for download functionality
    alert('Tính năng tải xuống sẽ được cập nhật sớm!');
  };

  if (movieLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-white">Movie not found</p>
      </div>
    );
  }

  const cast = credits?.cast || [];
  const recommendedMovies = similar?.results || [];

  // Generate clip-path for tilted poster (matching TopMoviesTiltedSection style)
  const clipPathRight = 'polygon(94.239% 100%, 5.761% 100%, 5.761% 100%, 4.826% 99.95%, 3.94% 99.803%, 3.113% 99.569%, 2.358% 99.256%, 1.687% 98.87%, 1.111% 98.421%, .643% 97.915%, .294% 97.362%, .075% 96.768%, 0 96.142%, 0 3.858%, 0 3.858%, .087% 3.185%, .338% 2.552%, .737% 1.968%, 1.269% 1.442%, 1.92% .984%, 2.672% .602%, 3.512% .306%, 4.423% .105%, 5.391% .008%, 6.4% .024%, 94.879% 6.625%, 94.879% 6.625%, 95.731% 6.732%, 96.532% 6.919%, 97.272% 7.178%, 97.942% 7.503%, 98.533% 7.887%, 99.038% 8.323%, 99.445% 8.805%, 99.747% 9.326%, 99.935% 9.88%, 100% 10.459%, 100% 96.142%, 100% 96.142%, 99.925% 96.768%, 99.706% 97.362%, 99.357% 97.915%, 98.889% 98.421%, 98.313% 98.87%, 97.642% 99.256%, 96.887% 99.569%, 96.06% 99.803%, 95.174% 99.95%, 94.239% 100%)';

  const tabs = [
    { id: 'episodes' as TabType, label: 'Tập phim' },
    { id: 'gallery' as TabType, label: 'Gallery' },
    { id: 'cast' as TabType, label: 'Diễn viên' },
    { id: 'recommendations' as TabType, label: 'Đề xuất' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 -mt-16 md:-mt-20">
      {/* Hero Banner - Backdrop image only */}
      <div className="relative h-[calc(60vh+4rem)] md:h-[calc(70vh+5rem)]">
        <div className="absolute inset-0">
          <img
            src={getImageUrl(movie.backdrop_path, 'backdrop', 'original')}
            alt={movie.title}
            className="w-full h-full object-cover object-center"
          />
          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 via-transparent to-transparent" />
        </div>
      </div>

      {/* Content Below Banner */}
      <div className="container mx-auto px-4 md:px-8 -mt-32 md:-mt-40 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          {/* Poster with decorative frame */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-start"
          >
            <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-4 shadow-2xl">
              {/* Decorative corner accents */}
              <div className="absolute -top-2 -left-2 w-10 h-10 border-t-2 border-l-2 border-red-500/60 rounded-tl-2xl"></div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 border-b-2 border-r-2 border-red-500/60 rounded-br-2xl"></div>

              {/* Tilted Poster */}
              <div className="relative w-[180px] md:w-[260px]">
                <div
                  className="relative aspect-[2/3] overflow-hidden bg-gray-900 shadow-2xl"
                  style={{
                    clipPath: clipPathRight,
                    WebkitClipPath: clipPathRight,
                  }}
                >
                  <img
                    src={getImageUrl(movie.poster_path, 'poster', 'large')}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Movie Title & Year Below Poster */}
                <div className="mt-4 text-center space-y-2">
                  <h2 className="text-white font-bold text-base md:text-lg line-clamp-2">
                    {movie.title}
                  </h2>
                  {movie.original_title && movie.original_title !== movie.title && (
                    <p className="text-gray-400 text-xs italic">
                      {movie.original_title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Movie Info - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 max-w-3xl space-y-5 w-full text-center md:text-left"
          >
            {/* Title & Meta */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-shadow-lg">
                {movie.title}
              </h1>

              {/* Badges Row */}
              <div className="flex items-center flex-wrap gap-3 justify-center md:justify-start">
                {/* Rating Badge */}
                <div className="flex items-center gap-1.5 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/40 px-3 py-1.5 rounded-lg">
                  <span className="text-yellow-400 font-bold text-sm">★</span>
                  <span className="text-white font-semibold text-sm">
                    {movie.vote_average.toFixed(1)}
                  </span>
                </div>

                {/* Age Rating */}
                <div className="bg-white/15 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-lg">
                  <span className="text-white font-bold text-sm">T13</span>
                </div>

                {/* Year */}
                {movie.release_date && (
                  <div className="bg-white/15 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-lg">
                    <span className="text-white font-semibold text-sm">
                      {new Date(movie.release_date).getFullYear()}
                    </span>
                  </div>
                )}

                {/* Runtime */}
                {movie.runtime && (
                  <div className="bg-white/15 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-lg">
                    <span className="text-white font-semibold text-sm">
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 justify-center md:justify-start">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="text-white text-xs font-medium px-3 py-1.5 bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-600/50"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Watch Button */}
            <div className="flex justify-center md:justify-start">
              <Link
                to={`/watch/${movie.id}`}
                className="inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-3.5 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 text-base"
              >
                <IoPlay size={22} />
                <span>Xem Ngay</span>
              </Link>
            </div>

            {/* Overview */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-xl p-5 space-y-3">
              <h3 className="text-white font-bold text-base">Giới thiệu:</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {movie.overview || 'Chưa có thông tin giới thiệu'}
              </p>
            </div>

            {/* Additional Info Grid */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {movie.production_countries && movie.production_countries.length > 0 && (
                  <div>
                    <span className="text-gray-400 block mb-1">Quốc gia:</span>
                    <span className="text-white font-medium">{movie.production_countries[0].name}</span>
                  </div>
                )}

                {movie.production_companies && movie.production_companies.length > 0 && (
                  <div>
                    <span className="text-gray-400 block mb-1">Networks:</span>
                    <span className="text-white font-medium">{movie.production_companies[0].name}</span>
                  </div>
                )}

                {movie.production_companies && movie.production_companies.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-400 block mb-1">Sản xuất:</span>
                    <span className="text-white font-medium">
                      {movie.production_companies.slice(0, 3).map(c => c.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <Button
                onClick={handleWatchlistClick}
                disabled={!isAuthenticated}
                variant={inWatchlist ? 'danger' : 'outline'}
                size="sm"
                className={inWatchlist ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}
              >
                {inWatchlist ? (
                  <AiFillHeart className="mr-1" size={16} />
                ) : (
                  <FiHeart className="mr-1" size={16} />
                )}
                {inWatchlist ? 'Đã yêu thích' : 'Yêu thích'}
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <FiDownload className="mr-1" size={16} />
                Tải xuống
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
              >
                <FiShare2 className="mr-1" size={16} />
                Chia sẻ
              </Button>
              <Button
                onClick={handleScrollToComments}
                variant="outline"
                size="sm"
              >
                <FiMessageCircle className="mr-1" size={16} />
                Bình luận
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-md sticky top-16 md:top-20 z-40 mt-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-4 text-sm md:text-base font-medium transition-colors ${activeTab === tab.id
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12">
        {activeTab === 'episodes' && (
          <EpisodesTab movieId={movieId} movieTitle={movie?.title || ''} />
        )}
        {activeTab === 'gallery' && (
          <GalleryTab movieId={movieId} images={images} isLoading={!images} />
        )}
        {activeTab === 'cast' && (
          <CastTab movieId={movieId} cast={cast} isLoading={!credits} />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsTab
            movieId={movieId}
            movies={recommendedMovies}
            isLoading={!similar}
          />
        )}
      </div>
    </div>
  );
};

export default MovieDetails;
