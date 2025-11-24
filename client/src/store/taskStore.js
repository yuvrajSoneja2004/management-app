import { create } from 'zustand';
import api from '../api/axios';
import { fetchFilteredTasks } from '../api/project';

const useTaskStore = create((set, get) => ({
    tasks: [],
    selectedTasks: [],
    filters: {},
    isLoading: false,
    error: null,

    fetchTasks: async (projectId, filters = {}) => {
        set({ isLoading: true });
        try {
            const tasks = await fetchFilteredTasks(projectId, filters);
            set({ tasks, filters, isLoading: false });
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

    // Selection management
    toggleTaskSelection: (taskId) => set((state) => {
        const isSelected = state.selectedTasks.includes(taskId);
        return {
            selectedTasks: isSelected
                ? state.selectedTasks.filter(id => id !== taskId)
                : [...state.selectedTasks, taskId]
        };
    }),

    selectAllTasks: () => set((state) => ({
        selectedTasks: state.tasks.map(t => t._id)
    })),

    clearSelection: () => set({ selectedTasks: [] }),

    // Real-time state updaters
    addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

    updateTaskState: (task) => set((state) => ({
        tasks: state.tasks.map((t) => (t._id === task._id ? task : t)),
    })),

    removeTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
        selectedTasks: state.selectedTasks.filter(id => id !== taskId)
    })),
}));

export default useTaskStore;
