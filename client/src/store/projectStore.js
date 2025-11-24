import { create } from 'zustand';
import api from '../api/axios';

const useProjectStore = create((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,

    fetchProjects: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get('/projects');
            set({ projects: res.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createProject: async (projectData) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/projects', projectData);
            set((state) => ({
                projects: [res.data, ...state.projects],
                isLoading: false
            }));
            return res.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    getProject: async (id) => {
        set({ isLoading: true });
        try {
            const res = await api.get(`/projects/${id}`);
            set({ currentProject: res.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
}));

export default useProjectStore;
