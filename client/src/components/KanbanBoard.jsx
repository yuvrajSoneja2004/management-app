import { useState } from 'react';
import { useGetTasksQuery } from '@/store/api/tasksApi';
import KanbanColumn from './KanbanColumn';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];
const TASKS_PER_PAGE = 10;

const KanbanBoard = ({ projectId, onTaskClick, onAddTask, isViewer, selectedTasks, onTaskSelect }) => {
    // Separate pagination state for each column
    const [columnPages, setColumnPages] = useState({
        'Todo': 1,
        'In Progress': 1,
        'Review': 1,
        'Completed': 1
    });

    // Fetch tasks for each status separately
    const todoQuery = useGetTasksQuery({
        projectId,
        status: 'Todo',
        page: columnPages['Todo'],
        limit: TASKS_PER_PAGE
    });

    const inProgressQuery = useGetTasksQuery({
        projectId,
        status: 'In Progress',
        page: columnPages['In Progress'],
        limit: TASKS_PER_PAGE
    });

    const reviewQuery = useGetTasksQuery({
        projectId,
        status: 'Review',
        page: columnPages['Review'],
        limit: TASKS_PER_PAGE
    });

    const completedQuery = useGetTasksQuery({
        projectId,
        status: 'Completed',
        page: columnPages['Completed'],
        limit: TASKS_PER_PAGE
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            {STATUSES.map((status) => {
                const query = queries[status];
                return (
                    <KanbanColumn
                        key={status}
                        title={status}
                        status={status}
                        tasks={query.data?.tasks || []}
                        isLoading={query.isLoading}
                        pagination={query.data?.pagination}
                        onPageChange={(newPage) => handlePageChange(status, newPage)}
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
