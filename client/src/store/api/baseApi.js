import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    prepareHeaders: (headers, { getState }) => {
        // Get token from Zustand auth store
        const token = localStorage.getItem('auth-storage');
        if (token) {
            try {
                const authData = JSON.parse(token);
                if (authData.state?.token) {
                    headers.set('authorization', `Bearer ${authData.state.token}`);
                }
            } catch (error) {
                console.error('Error parsing auth token:', error);
            }
        }
        return headers;
    },
    credentials: 'include', // Include cookies for refresh tokens
});

// Base query with re-auth logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // Handle 401 errors - try to refresh token
    if (result.error && result.error.status === 401) {
        // Try to refresh token
        const refreshResult = await baseQuery(
            { url: '/auth/refresh', method: 'GET' },
            api,
            extraOptions
        );

        if (refreshResult.data) {
            // Update token in localStorage
            const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
            authData.state = {
                ...authData.state,
                token: refreshResult.data.accessToken,
            };
            localStorage.setItem('auth-storage', JSON.stringify(authData));

            // Retry original request
            result = await baseQuery(args, api, extraOptions);
        } else {
            // Refresh failed - clear auth and redirect to login
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
        }
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Auth', 'Projects', 'Tasks', 'Files', 'Notifications', 'Invitations'],
    endpoints: () => ({}),
});
