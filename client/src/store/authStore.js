import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            setToken: (token) => set({ token, isAuthenticated: !!token }),

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await api.post('/auth/login', { email, password });
                    set({
                        user: res.data,
                        token: res.data.accessToken,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        error: error.response?.data?.message || 'Login failed',
                        isLoading: false
                    });
                }
            },

            register: async (username, email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await api.post('/auth/register', { username, email, password });
                    set({
                        user: res.data,
                        token: res.data.accessToken,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        error: error.response?.data?.message || 'Registration failed',
                        isLoading: false
                    });
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    console.error('Logout error', error);
                }
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage', // localStorage key
            partialPersist: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

export default useAuthStore;
