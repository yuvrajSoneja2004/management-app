import { useState, useMemo } from 'react';
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
        // If assignee filter is set, pass it (backend expects 'assignee' or 'assignees' depending on implementation, 
        // service says: if (queryParams.assignee) filters.assignees = queryParams.assignee;)
        // So we pass 'assignee'
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
                );
            })}
        </div >
    );
};

export default KanbanBoard;
