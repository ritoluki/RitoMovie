import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    maxPage?: number;
}

const Pagination = ({ currentPage, totalPages, onPageChange, maxPage = 500 }: PaginationProps) => {
    const [inputPage, setInputPage] = useState('');
    const effectiveTotalPages = Math.min(totalPages, maxPage);

    useEffect(() => {
        setInputPage('');
    }, [currentPage]);

    const handlePageInput = (e: React.FormEvent) => {
        e.preventDefault();
        const page = parseInt(inputPage);
        if (page >= 1 && page <= effectiveTotalPages) {
            onPageChange(page);
            setInputPage('');
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 5; // Số trang hiển thị xung quanh trang hiện tại

        if (effectiveTotalPages <= 7) {
            // Nếu tổng số trang ít, hiển thị tất cả
            for (let i = 1; i <= effectiveTotalPages; i++) {
                pages.push(i);
            }
        } else {
            // Luôn hiển thị trang đầu
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Hiển thị các trang xung quanh trang hiện tại
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(effectiveTotalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < effectiveTotalPages - 2) {
                pages.push('...');
            }

            // Luôn hiển thị trang cuối
            pages.push(effectiveTotalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-3 mt-12">
            {/* Previous Page */}
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center"
                aria-label="Trang trước"
            >
                <FiChevronLeft size={18} />
            </button>

            {/* Center Container */}
            <div className="flex items-center gap-3 bg-gray-800/50 rounded-full px-4 py-2">
                <span className="text-gray-400 text-sm font-medium">Trang</span>

                {/* Current Page Input */}
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inputPage || currentPage}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setInputPage(value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const page = parseInt(inputPage);
                            if (page >= 1 && page <= effectiveTotalPages) {
                                onPageChange(page);
                                setInputPage('');
                            }
                        }
                    }}
                    onBlur={() => {
                        if (inputPage) {
                            const page = parseInt(inputPage);
                            if (page >= 1 && page <= effectiveTotalPages) {
                                onPageChange(page);
                            }
                            setInputPage('');
                        }
                    }}
                    className="w-12 px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <span className="text-gray-400 text-sm">/ {effectiveTotalPages}</span>
            </div>

            {/* Next Page */}
            <button
                onClick={() => onPageChange(Math.min(effectiveTotalPages, currentPage + 1))}
                disabled={currentPage >= effectiveTotalPages}
                className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center"
                aria-label="Trang sau"
            >
                <FiChevronRight size={18} />
            </button>
        </div>
    );
};

export default Pagination;
