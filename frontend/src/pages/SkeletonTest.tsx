import SkeletonMovieRow from '@/components/common/SkeletonMovieRow';

/**
 * Component test để kiểm tra skeleton loading animations
 */
const SkeletonTest = () => {
    return (
        <div className="min-h-screen bg-gray-900 p-8 space-y-8">
            <h1 className="text-4xl font-bold text-white">Skeleton Loading Test</h1>

            <div className="space-y-8">
                <SkeletonMovieRow title="Phim Hành Động" />
                <SkeletonMovieRow title="Phim Kinh Dị" />
                <SkeletonMovieRow title="Phim Hài" />
            </div>

            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                <h2 className="text-xl text-white mb-4">Animation Test</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" />
                        <span className="text-white">Bounce animation</span>
                    </div>

                    <div className="h-2 bg-gray-700 rounded overflow-hidden">
                        <div className="h-full w-20 bg-red-500 animate-loading-bar" />
                    </div>
                    <span className="text-white text-sm">Loading bar animation</span>

                    <div className="relative h-20 bg-gray-700 rounded overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                    <span className="text-white text-sm">Shimmer animation</span>
                </div>
            </div>
        </div>
    );
};

export default SkeletonTest;
