import { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PhimMovieSummary } from '@/types';
import PhimCard from './PhimCard';

interface PhimRowProps {
    title: string;
    items?: PhimMovieSummary[];
    link?: string;
}

import { Link } from 'react-router-dom';
const PhimRow = ({ title, items, link }: PhimRowProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const filteredItems = useMemo(() => {
        return items || [];
    }, [items]);

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeft(scrollLeft > 0);
            setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
        };

        const container = scrollRef.current;
        handleScroll();
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [filteredItems]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const delta = scrollRef.current.clientWidth * 0.8;
        const nextPosition = direction === 'left'
            ? scrollRef.current.scrollLeft - delta
            : scrollRef.current.scrollLeft + delta;

        scrollRef.current.scrollTo({ left: nextPosition, behavior: 'smooth' });
    };

    if (!filteredItems.length) {
        return null;
    }

        return (
                <div className="mb-10 md:mb-14 group">
                        <div className="mb-4 flex items-center gap-3 px-4 md:px-8">
                                <h2 className="text-2xl font-bold text-white md:text-3xl">{title}</h2>
                                {link && (
                                    <Link
                                        to={link}
                                        className="group/more flex items-center justify-center gap-0 px-2 py-1 rounded-full group-hover/more:rounded-lg border-2 border-white/30 group-hover/more:border-red-500/50 hover:bg-red-500/10 text-white transition-all duration-300"
                                    >
                                        <span className="text-sm font-medium text-red-500 max-w-0 group-hover/more:max-w-[80px] group-hover/more:pl-2 group-hover/more:pr-1 opacity-0 group-hover/more:opacity-100 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden">
                                            Xem thêm
                                        </span>
                                        <FiChevronRight size={16} className="flex-shrink-0" />
                                    </Link>
                                )}
                        </div>

            <div className="relative">
                {showLeft && (
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="hidden md:block absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/80 p-3 text-white shadow-xl transition hover:scale-110 hover:bg-black/90"
                        aria-label="Scroll left"
                    >
                        <FiChevronLeft />
                    </button>
                )}

                <div ref={scrollRef} className="flex space-x-3 overflow-x-auto px-4 py-2 scrollbar-hide md:space-x-4 md:px-8">
                    {filteredItems.map((item) => (
                        <div key={item._id} className="w-36 flex-none md:w-48 lg:w-52">
                            <PhimCard item={item} />
                        </div>
                    ))}
                </div>

                {showRight && (
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="hidden md:block absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/80 p-3 text-white shadow-xl transition hover:scale-110 hover:bg-black/90"
                        aria-label="Scroll right"
                    >
                        <FiChevronRight />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PhimRow;
