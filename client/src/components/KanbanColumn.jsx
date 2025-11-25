import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Pagination } from './ui/pagination';
import { Plus, Loader2 } from 'lucide-react';
import TaskCardSkeleton from './skeletons/TaskCardSkeleton';

const KanbanColumn = ({
    title,
    status,
    tasks = [],
    isLoading,
    pagination,
    onPageChange,
    onTaskClick,
    onAddTask,
    isViewer,
    selectedTasks = [],
    onTaskSelect,
    children
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Todo':
                return 'bg-gray-100 dark:bg-gray-800 border-gray-300';
            case 'In Progress':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300';
            case 'Review':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-300';
            case 'Completed':
                return 'bg-green-50 dark:bg-green-900/20 border-green-300';
            default:
                return 'bg-gray-100 dark:bg-gray-800 border-gray-300';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'High':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'Low':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Card className={`border-2 ${getStatusColor(status)} flex flex-col h-full`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            {title}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({pagination?.total || 0})
                            </span>
                        </CardTitle>
                        {!isViewer && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onAddTask(status)}
                                className="h-8 w-8 p-0"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
                    {/* Tasks Container with fixed height and scroll */}
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1 mb-3" style={{ minHeight: '400px', maxHeight: '600px' }}>
                        {isLoading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <TaskCardSkeleton key={i} />
                                ))}
                            </>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No tasks
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <Card
                                    key={task._id}
                                    className="cursor-pointer hover:shadow-md transition-shadow border"
                                    onClick={() => onTaskClick(task)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-medium text-sm line-clamp-2 flex-1">
                                                {task.title}
                                            </h4>
                                            {onTaskSelect && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTasks.includes(task._id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        onTaskSelect(task._id);
                                                    }}
                                                    className="mt-0.5"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>

                                            {task.assignees && task.assignees.length > 0 && (
                                                <div className="flex -space-x-2">
                                                    {task.assignees.slice(0, 3).map((assignee, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-800"
                                                            title={assignee.username || assignee.email}
                                                        >
                                                            {(assignee.username || assignee.email || '?')[0].toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {task.assignees.length > 3 && (
                                                        <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-800">
                                                            +{task.assignees.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {task.dueDate && (
                                            <div className="text-xs text-muted-foreground mt-2">
                                                Due: {new Date(task.dueDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Pagination at bottom */}
                    {pagination && pagination.pages > 1 && (
                        <div className="pt-2 border-t">
                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.pages}
                                onPageChange={onPageChange}
                                className="justify-center"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default KanbanColumn;
