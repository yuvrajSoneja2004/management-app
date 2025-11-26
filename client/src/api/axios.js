import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: 'https://apiJello.yuvrajsoneja.in/api',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                const res = await axios.get('https://apiJello.yuvrajsoneja.in/api/auth/refresh', {
                    withCredentials: true
                });

                const { accessToken } = res.data;

                // Update token in store
                useAuthStore.getState().setToken(accessToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                console.log('Token refresh failed, logging out...');
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Global error handling
        const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
        // Avoid showing toast for 401s as they are handled by refresh logic or redirection
        if (error.response?.status !== 401) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;
