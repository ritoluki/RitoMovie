import { useEffect, useState } from 'react';

/**
 * Options for useLazyLoadSection hook
 */
interface UseLazyLoadSectionOptions {
    /** Root margin for Intersection Observer (e.g., '300px'). Default: '300px' */
    rootMargin?: string;
    /** Load section immediately without waiting for intersection. Default: false */
    loadImmediately?: boolean;
    /** Delay in milliseconds before loading (only applies if loadImmediately is true). Default: 0 */
    delay?: number;
    /** Intersection threshold (0-1). Default: 0.01 */
    threshold?: number;
}

/**
 * Return type for useLazyLoadSection hook
 */
interface UseLazyLoadSectionReturn {
    /** Ref callback to attach to the section element for intersection observation */
    sectionRef: (node: HTMLElement | null) => void;
    /** Whether the section should load its data (trigger for React Query enabled option) */
    shouldLoad: boolean;
    /** Whether the section has already been loaded (prevents re-triggering) */
    hasLoaded: boolean;
}

/**
 * Custom hook for implementing lazy loading of page sections using Intersection Observer.
 * 
 * Supports 3 loading strategies:
 * 1. Immediate loading: `loadImmediately: true` - Load right away
 * 2. Delayed loading: `loadImmediately: true, delay: 500` - Load after a delay
 * 3. Lazy loading: `rootMargin: '300px'` - Load when user scrolls near (300px buffer)
 * 
 * @example
 * // Priority content - load immediately
 * const critical = useLazyLoadSection({ loadImmediately: true });
 * 
 * @example
 * // Delayed content - load after 500ms
 * const priority = useLazyLoadSection({ loadImmediately: true, delay: 500 });
 * 
 * @example
 * // Lazy content - load when scrolling near
 * const lazy = useLazyLoadSection({ rootMargin: '300px' });
 * const { data } = useQuery({
 *   enabled: lazy.shouldLoad,
 *   // ... query config
 * });
 * 
 * @param options - Configuration options for lazy loading behavior
 * @returns Object containing sectionRef, shouldLoad, and hasLoaded
 */
export function useLazyLoadSection(
    options: UseLazyLoadSectionOptions = {}
): UseLazyLoadSectionReturn {
    const {
        rootMargin = '300px',
        loadImmediately = false,
        delay = 0,
        threshold = 0.1, // Increased from 0.01 to be more reliable
    } = options;

    const [shouldLoad, setShouldLoad] = useState(loadImmediately && delay === 0);
    const [hasLoaded, setHasLoaded] = useState(loadImmediately && delay === 0);
    const [element, setElement] = useState<HTMLElement | null>(null);

    // Callback ref
    const sectionRef = (node: HTMLElement | null) => {
        setElement(node);
    };

    useEffect(() => {
        // Handle immediate loading with optional delay
        if (loadImmediately) {
            if (delay > 0) {
                const timer = setTimeout(() => {
                    setShouldLoad(true);
                    setHasLoaded(true);
                }, delay);
                return () => clearTimeout(timer);
            }
            // If delay is 0, already set in useState initial value
            return;
        }

        // Handle lazy loading with Intersection Observer
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasLoaded) {
                        setShouldLoad(true);
                        setHasLoaded(true);
                        // Disconnect observer after first intersection
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin,
                threshold,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [loadImmediately, delay, rootMargin, threshold, hasLoaded, element]);

    return {
        sectionRef,
        shouldLoad,
        hasLoaded,
    };
}
