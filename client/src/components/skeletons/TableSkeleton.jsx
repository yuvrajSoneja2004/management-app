const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="animate-pulse">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                        {Array.from({ length: columns }).map((_, i) => (
                            <div key={i} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
                {/* Rows */}
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="border-b border-gray-200 p-4">
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div
                                    key={colIndex}
                                    className="h-4 bg-gray-200 rounded"
                                    style={{ width: colIndex === 0 ? '80%' : '100%' }}
                                ></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableSkeleton;
