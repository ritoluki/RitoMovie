import { useState } from 'react';
import { MovieImages } from '@/types';
import { getImageUrl } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

interface GalleryTabProps {
  movieId: number;
  images: MovieImages | undefined;
  isLoading?: boolean;
}

const GalleryTab = ({ movieId, images, isLoading }: GalleryTabProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'backdrops' | 'posters'>('backdrops');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!images) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Không có hình ảnh</p>
      </div>
    );
  }

  const currentImages = imageType === 'backdrops' ? images.backdrops : images.posters;

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <div className="flex items-center gap-4">
        <h3 className="text-2xl font-bold text-white">Gallery</h3>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setImageType('backdrops')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              imageType === 'backdrops'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Backdrops ({images.backdrops?.length || 0})
          </button>
          <button
            onClick={() => setImageType('posters')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              imageType === 'posters'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Posters ({images.posters?.length || 0})
          </button>
        </div>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {currentImages && currentImages.length > 0 ? (
          currentImages.map((image, index) => (
            <motion.div
              key={index}
              className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-800 aspect-video"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedImage(image.file_path)}
            >
              <img
                src={getImageUrl(image.file_path, 'backdrop', 'medium')}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-semibold">View Full Size</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400">Không có {imageType === 'backdrops' ? 'backdrops' : 'posters'}</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition-colors"
            >
              <FiX size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={getImageUrl(selectedImage, 'backdrop', 'original')}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryTab;

