import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface ScrollIndicatorProps {
    /** Sau bao nhiêu giây sẽ tự động ẩn (nếu không scroll) */
    autoHideDelay?: number;
    /** Class name tùy chỉnh */
    className?: string;
}

const ScrollIndicator = ({ autoHideDelay = 5000, className = '' }: ScrollIndicatorProps) => {
    const [isVisible, setIsVisible] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        let timeoutId: number;

        const handleScroll = () => {
            // Ẩn indicator khi người dùng scroll xuống > 100px
            if (window.scrollY > 100) {
                setIsVisible(false);
            }
        };

        // Tự động ẩn sau một khoảng thời gian
        timeoutId = window.setTimeout(() => {
            setIsVisible(false);
        }, autoHideDelay);

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [autoHideDelay]);

    const handleClick = () => {
        // Scroll xuống một màn hình
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-8 ${className}`}
                >
                    <button
                        onClick={handleClick}
                        className="group relative flex flex-col items-center gap-3 cursor-pointer"
                        aria-label="Scroll down to see more movies"
                    >
                        {/* Animated Icon Container */}
                        <motion.div
                            animate={{
                                y: [0, 12, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            className="relative"
                        >
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full scale-150" />

                            {/* Icon circle */}
                            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/50 group-hover:shadow-xl group-hover:shadow-red-500/70 transition-all duration-300 group-hover:scale-110">
                                <FiChevronDown className="text-white text-3xl" strokeWidth={2.5} />
                            </div>
                        </motion.div>

                        {/* Text with animated background */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-400/20 to-red-500/20 blur-md" />
                            <span className="relative block text-white text-sm font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 group-hover:border-red-500/50 transition-all duration-300">
                                {t('common.swipeUp')}
                            </span>
                        </motion.div>

                        {/* Subtle pulse animation */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            className="absolute top-0 w-14 h-14 rounded-full border-2 border-red-500/30 pointer-events-none"
                        />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ScrollIndicator;
