import { useState } from 'react';
import { useGetTasksQuery } from '@/store/api/tasksApi';
import KanbanColumn from './KanbanColumn';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];
const TASKS_PER_PAGE = 10;

const KanbanBoard = ({ projectId, filters, onTaskClick, onAddTask, isViewer, selectedTasks, onTaskSelect }) => {
    // Separate pagination state for each column
    const [columnPages, setColumnPages] = useState({
        'Todo': 1,
        'In Progress': 1,
        'Review': 1,
        'Completed': 1
    });

    const queryParams = {
        projectId,
        limit: TASKS_PER_PAGE,
        priority: filters.priority,
        search: filters.search,
        sortBy: filters.sortBy,
        order: filters.order,
        assignee: filters.assignee
    };

    // Fetch tasks for each status separately
    const todoQuery = useGetTasksQuery({
        ...queryParams,
        status: 'Todo',
        page: columnPages['Todo']
    });

    const inProgressQuery = useGetTasksQuery({
        ...queryParams,
        status: 'In Progress',
        page: columnPages['In Progress']
    });

    const reviewQuery = useGetTasksQuery({
        ...queryParams,
        status: 'Review',
        page: columnPages['Review']
    });

    const completedQuery = useGetTasksQuery({
        ...queryParams,
        status: 'Completed',
        page: columnPages['Completed']
    });

    const queries = {
        'Todo': todoQuery,
        'In Progress': inProgressQuery,
        'Review': reviewQuery,
        'Completed': completedQuery
    };

    const handlePageChange = (status, newPage) => {
        setColumnPages(prev => ({
            ...prev,
            [status]: newPage
        }));
    };

    // Filter statuses based on status filter
    const visibleStatuses = filters.status ? [filters.status] : STATUSES;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            {visibleStatuses.map((status) => {
                const query = queries[status];
                return (
                    <KanbanColumn
                        key={status}
                        title={status}
                        status={status}
                        tasks={query.data?.tasks || []}
                        isLoading={query.isLoading}
                        pagination={query.data?.pagination}
                        currentPage={columnPages[status]}
                        onPageChange={(page) => handlePageChange(status, page)}
                        onTaskClick={onTaskClick}
                        onAddTask={onAddTask}
                        isViewer={isViewer}
                        selectedTasks={selectedTasks}
                        onTaskSelect={onTaskSelect}
                    />
                );
            })}
        </div>
    );
};

export default KanbanBoard;
