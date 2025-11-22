import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PulseScrollHintProps {
    /** Sau bao nhiêu giây sẽ tự động ẩn */
    autoHideDelay?: number;
}

/**
 * Hiển thị một pulse animation ở dưới cùng màn hình
 * để gợi ý người dùng có thể scroll/swipe
 */
const PulseScrollHint = ({ autoHideDelay = 4000 }: PulseScrollHintProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        let timeoutId: number;

        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsVisible(false);
                localStorage.setItem('hasScrolled', 'true');
            }
        };

        // Check nếu người dùng đã từng scroll
        const hasScrolled = localStorage.getItem('hasScrolled');
        if (hasScrolled === 'true') {
            setIsVisible(false);
        } else {
            timeoutId = window.setTimeout(() => {
                setIsVisible(false);
            }, autoHideDelay);
        }

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [autoHideDelay]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
                >
                    {/* Pulse dots */}
                    <div className="flex items-center gap-2">
                        {[0, 1, 2].map((index) => (
                            <motion.div
                                key={index}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: index * 0.2,
                                    ease: 'easeInOut',
                                }}
                                className="w-2 h-2 rounded-full bg-white/80"
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PulseScrollHint;
