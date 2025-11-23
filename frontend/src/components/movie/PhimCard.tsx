import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { PhimMovieSummary } from '@/types';
import { getPhimImageUrl, truncateText } from '@/utils/helpers';
import { useMovies } from '@/hooks/useMovies';
import PhimPopup from './PhimPopup';

interface PhimCardProps {
    item: PhimMovieSummary;
}

const getTmdbNumericId = (item: PhimMovieSummary): number | null => {
    if (!item.tmdb?.id) return null;
    const parsed = Number(item.tmdb.id);
    return Number.isFinite(parsed) ? parsed : null;
};

const getTmdbMediaType = (item: PhimMovieSummary): 'movie' | 'tv' => {
    return item.tmdb?.type === 'tv' ? 'tv' : 'movie';
};

const PhimCard = ({ item }: PhimCardProps) => {
    const tmdbId = getTmdbNumericId(item);
    const mediaType = getTmdbMediaType(item);
    const slug = item.slug || item._id;
    const [showPopup, setShowPopup] = useState(false);
    const [shouldFetchDetails, setShouldFetchDetails] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    if (!slug) {
        return null;
    }

    const slugPath = encodeURIComponent(slug);
    const detailHref = tmdbId
        ? `/movie/${tmdbId}?type=${mediaType}`
        : `/watch/${slugPath}?type=${mediaType}`;
    const poster = getPhimImageUrl(item.thumb_url || item.poster_url);
    const episodeLabel = item.episode_current || item.time || '';
    const qualityLabel = item.quality || item.lang || '';

    const handleMouseEnter = () => {
        if (isMobile || !tmdbId) return;
        hoverTimeoutRef.current = setTimeout(() => {
            setShouldFetchDetails(true);
            setShowPopup(true);
        }, 500);
    };

    const handleMouseLeave = () => {
        if (isMobile || !tmdbId) return;
        setShowPopup(false);
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handlePopupClose = () => setShowPopup(false);

    const { useMovieDetails } = useMovies();
    const numericTmdbId = tmdbId ?? 0;
    const { data: tmdbDetails, isLoading: tmdbLoading } = useMovieDetails(numericTmdbId, {
        enabled: Boolean(tmdbId) && shouldFetchDetails,
        mediaType,
    });

    return (
        <div
            ref={cardRef}
            className={`relative transition-all duration-300 ${showPopup ? 'z-40' : 'z-0'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {!isMobile && showPopup && tmdbId && (
                <PhimPopup
                    item={item}
                    tmdbMovie={tmdbDetails}
                    isLoading={tmdbLoading}
                    isVisible={showPopup}
                    onClose={handlePopupClose}
                    cardRef={cardRef}
                />
            )}

            <Link to={detailHref} className="block group">
                <motion.div
                    className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800"
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.25 }}
                >
                    <img src={poster} alt={item.name} className="h-full w-full object-cover" loading="lazy" />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80" />

                    {/* Movie Info Overlay - Bottom */}
                    <div className="absolute inset-x-2 bottom-2 space-y-1">
                        {/* Episode/Status - Only show for series (phim bộ) */}
                        {item.episode_current && item.type === 'series' && (
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-yellow-400 drop-shadow-md">
                                {item.episode_current}
                            </p>
                        )}

                        {/* Movie Title */}
                        <h3 className="text-sm md:text-base font-bold text-white line-clamp-2 drop-shadow-lg">
                            {item.name}
                        </h3>

                        {/* Original Name */}
                        {item.origin_name && (
                            <p className="text-[10px] md:text-xs text-gray-300 line-clamp-1 drop-shadow-md">
                                {item.origin_name}
                            </p>
                        )}
                    </div>
                </motion.div>
            </Link>
        </div>
    );
};

export default PhimCard;
