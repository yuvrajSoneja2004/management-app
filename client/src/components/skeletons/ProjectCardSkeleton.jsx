const ProjectCardSkeleton = () => {
    return (
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
            <div className="flex items-center gap-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
        </div>
    );
};

export default ProjectCardSkeleton;
