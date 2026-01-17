import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
    src: string;
    alt: string;
    placeholder?: string;
}

const LazyImage = ({ src, alt, placeholder, className, ...props }: LazyImageProps) => {
    const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '100px', // Start loading 100px before entering viewport
                threshold: 0.01,
            }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isInView && src) {
            setImageSrc(src);
        }
    }, [isInView, src]);

    return (
        <img
            ref={imgRef}
            src={imageSrc || placeholder}
            alt={alt}
            className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
            onLoad={() => setIsLoaded(true)}
            {...props}
        />
    );
};

export default LazyImage;
