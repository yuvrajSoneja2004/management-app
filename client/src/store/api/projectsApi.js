import { baseApi } from './baseApi';

export const projectsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all projects with pagination
        getProjects: builder.query({
            query: ({ page = 1, limit = 20, status } = {}) => {
                let url = `/projects?page=${page}&limit=${limit}`;
                if (status) url += `&status=${status}`;
                return url;
            },
            providesTags: (result) =>
                result?.projects
                    ? [
                        ...result.projects.map(({ _id }) => ({ type: 'Projects', id: _id })),
                        { type: 'Projects', id: 'LIST' },
                    ]
                    : [{ type: 'Projects', id: 'LIST' }],
        }),

        // Get single project
        getProject: builder.query({
            query: (id) => `/projects/${id}`,
            providesTags: (result, error, id) => [{ type: 'Projects', id }],
        }),

        // Create project
        createProject: builder.mutation({
            query: (project) => ({
                url: '/projects',
                method: 'POST',
                body: project,
            }),
            invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
            // Optimistic update
            async onQueryStarted(project, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    projectsApi.util.updateQueryData('getProjects', { page: 1, limit: 20 }, (draft) => {
                        draft.projects.unshift({
                            ...project,
                            _id: 'temp-' + Date.now(),
                            createdAt: new Date().toISOString(),
                        });
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),

        // Update project
        updateProject: builder.mutation({
            query: ({ id, ...updates }) => ({
                url: `/projects/${id}`,
                method: 'PUT',
                body: updates,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Projects', id }],
            // Optimistic update
            async onQueryStarted({ id, ...updates }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    projectsApi.util.updateQueryData('getProject', id, (draft) => {
                        Object.assign(draft, updates);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),

        // Delete project
        deleteProject: builder.mutation({
            query: (id) => ({
                url: `/projects/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
        }),

        // Invite member
        inviteMember: builder.mutation({
            query: ({ projectId, email, role }) => ({
                url: `/projects/${projectId}/invite`,
                method: 'POST',
                body: { email, role },
            }),
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'Projects', id: projectId },
                { type: 'Invitations', id: 'LIST' },
            ],
        }),

        // Accept invitation
        acceptInvitation: builder.mutation({
            query: (token) => ({
                url: `/projects/invitations/${token}/accept`,
                method: 'POST',
            }),
            invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
        }),

        // Get project invitations
        getProjectInvitations: builder.query({
            query: (projectId) => `/projects/${projectId}/invitations`,
            providesTags: [{ type: 'Invitations', id: 'LIST' }],
        }),

        // Get project activities
        getProjectActivities: builder.query({
            query: ({ projectId, page = 1, limit = 20 }) =>
                `/projects/${projectId}/activities?page=${page}&limit=${limit}`,
        }),

        // Archive project
        archiveProject: builder.mutation({
            query: (id) => ({
                url: `/projects/${id}/archive`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Projects', id },
                { type: 'Projects', id: 'LIST' },
            ],
        }),

        // Unarchive project
        unarchiveProject: builder.mutation({
            query: (id) => ({
                url: `/projects/${id}/unarchive`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Projects', id },
                { type: 'Projects', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetProjectsQuery,
    useGetProjectQuery,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation,
    useInviteMemberMutation,
    useAcceptInvitationMutation,
    useGetProjectInvitationsQuery,
    useGetProjectActivitiesQuery,
    useArchiveProjectMutation,
    useUnarchiveProjectMutation,
} = projectsApi;
