import { Loader2 } from 'lucide-react';

interface SectionDividerProps {
    /** Whether content is loading */
    isLoading?: boolean;
    /** Text to show when loading */
    loadingText?: string;
    /** Show progress dots */
    showProgress?: boolean;
}

/**
 * Visual divider between sections that shows loading state
 * Helps users understand content is being fetched
 */
const SectionDivider = ({
    isLoading = false,
    loadingText = 'Đang tải nội dung mới',
    showProgress = true
}: SectionDividerProps) => {
    if (!isLoading) return null;

    return (
        <div className="py-8 flex items-center justify-center">
            <div className="flex items-center space-x-3 bg-gray-900/50 backdrop-blur-sm px-6 py-4 rounded-lg border border-gray-800/50">
                {/* Spinning loader icon */}
                <Loader2 className="w-5 h-5 text-red-500 animate-spin" />

                {/* Loading text */}
                <span className="text-gray-300 text-sm font-medium">
                    {loadingText}
                </span>

                {/* Progress dots */}
                {showProgress && (
                    <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SectionDivider;
