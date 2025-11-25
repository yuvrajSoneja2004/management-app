import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }) {
    const pages = [];
    const maxVisiblePages = 5;

    // Calculate which pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    if (totalPages <= 1) return null;

    return (
        <div className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {startPage > 1 && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        className="h-8 w-8 p-0 hidden sm:inline-flex"
                    >
                        1
                    </Button>
                    {startPage > 2 && (
                        <span className="px-1 text-gray-500 hidden sm:inline">...</span>
                    )}
                </>
            )}

            {pages.map((page) => (
                <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="h-8 w-8 p-0"
                >
                    {page}
                </Button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && (
                        <span className="px-1 text-gray-500 hidden sm:inline">...</span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        className="h-8 w-8 p-0 hidden sm:inline-flex"
                    >
                        {totalPages}
                    </Button>
                </>
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 hidden sm:inline">
                Page {currentPage} of {totalPages}
            </span>
        </div>
    );
}
