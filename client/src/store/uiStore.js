import { create } from 'zustand';

const useUIStore = create((set) => ({
    // Modal/Dialog state
    modals: {
        createProject: false,
        editProject: false,
        createTask: false,
        editTask: false,
        inviteMember: false,
        confirmDelete: false,
    },

    // Loading states (for operations not covered by RTK Query)
    loading: {},

    // Theme
    theme: 'light',

    // Sidebar
    sidebarCollapsed: false,

    // Toast queue (managed by sonner, but we can track here if needed)
    toasts: [],

    // Open modal
    openModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: true },
    })),

    // Close modal
    closeModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: false },
    })),

    // Close all modals
    closeAllModals: () => set({
        modals: {
            createProject: false,
            editProject: false,
            createTask: false,
            editTask: false,
            inviteMember: false,
            confirmDelete: false,
        },
    }),

    // Set loading state
    setLoading: (key, value) => set((state) => ({
        loading: { ...state.loading, [key]: value },
    })),

    // Toggle theme
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
    })),

    // Set theme
    setTheme: (theme) => set({ theme }),

    // Toggle sidebar
    toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed,
    })),

    // Set sidebar state
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));

export default useUIStore;
