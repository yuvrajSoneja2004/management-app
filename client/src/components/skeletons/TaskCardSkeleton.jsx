const TaskCardSkeleton = () => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5 mb-4"></div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            </div>
        </div>
    );
};

export default TaskCardSkeleton;
