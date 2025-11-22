import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const BackToTop = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled down
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group hover:scale-110"
                    aria-label={t('common.backToTop', 'Back to top')}
                    title={t('common.backToTop', 'Lên đầu trang')}
                >
                    <FiArrowUp size={24} className="group-hover:translate-y-[-2px] transition-transform" />
                </button>
            )}
        </>
    );
};

export default BackToTop;
