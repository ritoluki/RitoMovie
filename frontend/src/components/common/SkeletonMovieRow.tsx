import { useEffect, useState } from 'react';

/**
 * Skeleton loading component that mimics the actual MovieRow layout
 * Shows animated placeholder cards while data is loading
 * Automatically calculates number of cards based on viewport width
 */
const SkeletonMovieRow = () => {
    const [cardCount, setCardCount] = useState(6);

    useEffect(() => {
        const calculateCardCount = () => {
            const width = window.innerWidth;
            // Card widths: mobile(144px/w-36) + tablet(192px/w-48) + desktop(208px/w-52)
            // Gap: 12px (space-x-3)
            // Padding: mobile(16px*2) + tablet(32px*2)

            let cardWidth: number;
            let padding: number;

            if (width < 768) {
                // Mobile: w-36 = 144px
                cardWidth = 144;
                padding = 32; // px-4 (16px * 2)
            } else if (width < 1024) {
                // Tablet: w-48 = 192px
                cardWidth = 192;
                padding = 64; // px-8 (32px * 2)
            } else {
                // Desktop: w-52 = 208px
                cardWidth = 208;
                padding = 64; // px-8 (32px * 2)
            }

            const gap = 12; // space-x-3
            const availableWidth = width - padding;

            // Calculate how many cards fit + add 1-2 extra for smooth scrolling
            const fitsInView = Math.floor((availableWidth + gap) / (cardWidth + gap));
            const count = Math.max(fitsInView + 2, 6); // Minimum 6, add 2 extra for scroll

            setCardCount(count);
        };

        calculateCardCount();
        window.addEventListener('resize', calculateCardCount);

        return () => window.removeEventListener('resize', calculateCardCount);
    }, []);

    return (
        <div className="mb-8 md:mb-12">
            {/* Title skeleton with loading badge */}
            <div className="px-4 md:px-8 mb-4 flex items-center gap-3">
                <div className="h-6 md:h-8 w-48 bg-gray-700/50 rounded animate-pulse" />
                <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full animate-pulse">
                    Đang tải...
                </span>
            </div>

            {/* Movie cards skeleton */}
            <div className="relative px-4 md:px-8">
                <div className="flex space-x-3 overflow-hidden">
                    {[...Array(cardCount)].map((_, index) => (
                        <div
                            key={index}
                            className="flex-none w-36 md:w-48 lg:w-52"
                        >
                            {/* Card skeleton */}
                            <div className="relative group">
                                {/* Image skeleton */}
                                <div className="relative aspect-[2/3] bg-gray-700/50 rounded-lg overflow-hidden">
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gray-600/20 to-transparent" />
                                </div>

                                {/* Title skeleton */}
                                <div className="mt-2 space-y-2">
                                    <div className="h-4 bg-gray-700/50 rounded animate-pulse" />
                                    <div className="h-3 w-3/4 bg-gray-700/50 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkeletonMovieRow;
