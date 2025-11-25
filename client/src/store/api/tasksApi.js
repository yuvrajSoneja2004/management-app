import { baseApi } from './baseApi';

export const tasksApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get tasks by project
        getTasks: builder.query({
            query: ({ projectId, page = 1, limit = 50, status, priority, search }) => {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                });
                if (status) params.append('status', status);
                if (priority) params.append('priority', priority);
                if (search) params.append('search', search);

                return `/tasks/project/${projectId}?${params.toString()}`;
            },
            providesTags: (result, error, { projectId }) =>
                result?.tasks
                    ? [
                        ...result.tasks.map(({ _id }) => ({ type: 'Tasks', id: _id })),
                        { type: 'Tasks', id: `PROJECT-${projectId}` },
                    ]
                    : [{ type: 'Tasks', id: `PROJECT-${projectId}` }],
        }),

        // Create task
        createTask: builder.mutation({
            query: (task) => ({
                url: '/tasks',
                method: 'POST',
                body: task,
            }),
            invalidatesTags: (result, error, task) => [
                { type: 'Tasks', id: `PROJECT-${task.projectId}` },
            ],
            // Optimistic update
            async onQueryStarted(task, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    tasksApi.util.updateQueryData(
                        'getTasks',
                        { projectId: task.projectId, page: 1, limit: 50 },
                        (draft) => {
                            draft.tasks.unshift({
                                ...task,
                                _id: 'temp-' + Date.now(),
                                createdAt: new Date().toISOString(),
                            });
                        }
                    )
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),

        // Update task
        updateTask: builder.mutation({
            query: ({ id, ...updates }) => ({
                url: `/tasks/${id}`,
                method: 'PUT',
                body: updates,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Tasks', id }],
            // Optimistic update
            async onQueryStarted({ id, projectId, ...updates }, { dispatch, queryFulfilled }) {
                const patchResults = [];

                // Update in task list
                const listPatch = dispatch(
                    tasksApi.util.updateQueryData(
                        'getTasks',
                        { projectId, page: 1, limit: 50 },
                        (draft) => {
                            const task = draft.tasks.find((t) => t._id === id);
                            if (task) {
                                Object.assign(task, updates);
                            }
                        }
                    )
                );
                patchResults.push(listPatch);

                try {
                    await queryFulfilled;
                } catch {
                    patchResults.forEach((patch) => patch.undo());
                }
            },
        }),

        // Delete task
        deleteTask: builder.mutation({
            query: (id) => ({
                url: `/tasks/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Tasks', id }],
        }),

        // Bulk update status
        bulkUpdateStatus: builder.mutation({
            query: ({ taskIds, status }) => ({
                url: '/tasks/bulk/status',
                method: 'POST',
                body: { taskIds, status },
            }),
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'Tasks', id: `PROJECT-${projectId}` },
            ],
        }),

        // Bulk assign
        bulkAssign: builder.mutation({
            query: ({ taskIds, assigneeIds }) => ({
                url: '/tasks/bulk/assign',
                method: 'POST',
                body: { taskIds, assigneeIds },
            }),
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'Tasks', id: `PROJECT-${projectId}` },
            ],
        }),

        // Bulk delete
        bulkDelete: builder.mutation({
            query: ({ taskIds }) => ({
                url: '/tasks/bulk/delete',
                method: 'POST',
                body: { taskIds },
            }),
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'Tasks', id: `PROJECT-${projectId}` },
            ],
        }),
    }),
});

export const {
    useGetTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useBulkUpdateStatusMutation,
    useBulkAssignMutation,
    useBulkDeleteMutation,
} = tasksApi;
