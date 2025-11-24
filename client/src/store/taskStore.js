import { create } from 'zustand';
import api from '../api/axios';

const useTaskStore = create((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,

    fetchTasks: async (projectId) => {
        set({ isLoading: true });
        try {
            const res = await api.get(`/tasks/project/${projectId}`);
            set({ tasks: res.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createTask: async (taskData) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/tasks', taskData);
            set((state) => ({
                tasks: [res.data, ...state.tasks],
                isLoading: false
            }));
            return res.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    updateTask: async (id, updates) => {
        try {
            const res = await api.put(`/tasks/${id}`, updates);
            set((state) => ({
                tasks: state.tasks.map((t) => (t._id === id ? res.data : t)),
            }));
        } catch (error) {
            console.error('Failed to update task', error);
        }
    },

    deleteTask: async (id) => {
        try {
            await api.delete(`/tasks/${id}`);
            set((state) => ({
                tasks: state.tasks.filter((t) => t._id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete task', error);
        }
    },

    // Real-time state updaters
    addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

    updateTaskState: (task) => set((state) => ({
        tasks: state.tasks.map((t) => (t._id === task._id ? task : t)),
    })),

    removeTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
    })),
}));

export default useTaskStore;
