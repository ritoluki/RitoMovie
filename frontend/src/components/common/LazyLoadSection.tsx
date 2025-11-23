import { ReactNode, useEffect, useRef, useState } from 'react';

interface LazyLoadSectionProps {
    children: ReactNode;
    className?: string;
    threshold?: number;
    rootMargin?: string;
    fallback?: ReactNode;
    onVisible?: () => void;
}

/**
 * Component wrapper để lazy load content khi user scroll đến
 * Sử dụng Intersection Observer API để phát hiện khi element vào viewport
 */
const LazyLoadSection = ({
    children,
    className = '',
    threshold = 0.1,
    rootMargin = '200px',
    fallback = null,
    onVisible,
}: LazyLoadSectionProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentRef = sectionRef.current;
        if (!currentRef) return;

        // Nếu đã từng visible rồi thì không cần observe nữa
        if (hasBeenVisible) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        setHasBeenVisible(true);
                        onVisible?.();
                        // Unobserve sau khi đã load
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold,
                rootMargin, // Load trước khi user scroll đến 200px
            }
        );

        observer.observe(currentRef);

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [threshold, rootMargin, onVisible, hasBeenVisible]);

    return (
        <div ref={sectionRef} className={className}>
            {isVisible ? children : fallback}
        </div>
    );
};

export default LazyLoadSection;
