import { baseApi } from './baseApi';

export const filesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Upload file
        uploadFile: builder.mutation({
            query: ({ taskId, file }) => {
                const formData = new FormData();
                formData.append('file', file);

                return {
                    url: `/files/upload/${taskId}`,
                    method: 'POST',
                    body: formData,
                    // Don't set Content-Type header - browser will set it with boundary
                };
            },
            invalidatesTags: (result, error, { taskId }) => [
                { type: 'Tasks', id: taskId },
            ],
        }),
    }),
});

export const {
    useUploadFileMutation,
} = filesApi;
