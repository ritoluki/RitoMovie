/**
 * Skeleton loading - chỉ hiển thị logo loading ở giữa
 */
const SkeletonMovieRow = () => {
    return (
        <div className="flex items-center justify-center py-12 md:py-16">
            {/* Netflix-style loading spinner */}
            <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin" />
            </div>
        </div>
    );
};

export default SkeletonMovieRow;
