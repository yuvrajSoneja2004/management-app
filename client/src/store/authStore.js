import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            // Set user and token (called after successful login/register from RTK Query)
            setAuth: (user, token) => set({
                user,
                token,
                isAuthenticated: true,
            }),

            // Set only token (for refresh)
            setToken: (token) => set({ token, isAuthenticated: !!token }),

            // Clear auth (logout)
            clearAuth: () => set({
                user: null,
                token: null,
                isAuthenticated: false,
            }),

            // Update user data
            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData },
            })),
        }),
        {
            name: 'auth-storage',
            partialPersist: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
