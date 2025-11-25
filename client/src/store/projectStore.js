import { create } from 'zustand';
import api from '../api/axios';
import useAuthStore from './authStore';

const useProjectStore = create((set, get) => ({
    projects: [],
    currentProject: null,
    userRole: null, // Current user's role in the current project
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
        // Clear previous project data immediately to show loading state
        set({ currentProject: null, userRole: null, isLoading: true });
        try {
            const res = await api.get(`/projects/${id}`);
            const project = res.data;

            // Determine user's role in this project
            const currentUser = useAuthStore.getState().user;
            let role = null;

            if (project.owner._id === currentUser._id || project.owner === currentUser._id) {
                role = 'Owner';
            } else {
                const member = project.members.find(m =>
                    (m.user._id || m.user) === currentUser._id
                );
                role = member?.role || null;
            }

            set({ currentProject: project, userRole: role, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    projectStats: null,
    fetchProjectStats: async (projectId) => {
        try {
            const res = await api.get(`/projects/${projectId}/statistics`);
            set({ projectStats: res.data });
        } catch (error) {
            console.error('Failed to fetch project stats', error);
        }
    },
}));

export default useProjectStore;
