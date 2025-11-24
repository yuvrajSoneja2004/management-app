import api from './axios';

// Project Invitations
export const inviteMember = async (projectId, email, role) => {
    const res = await api.post(`/projects/${projectId}/invite`, { email, role });
    return res.data;
};

export const acceptInvitation = async (token) => {
    const res = await api.post(`/projects/invitations/${token}/accept`);
    return res.data;
};

export const getProjectInvitations = async (projectId) => {
    const res = await api.get(`/projects/${projectId}/invitations`);
    return res.data;
};

export const cancelInvitation = async (invitationId) => {
    const res = await api.delete(`/projects/invitations/${invitationId}`);
    return res.data;
};

// Activity Log
export const getProjectActivities = async (projectId, page = 1, limit = 20) => {
    const res = await api.get(`/projects/${projectId}/activities`, {
        params: { page, limit }
    });
    return res.data;
};

// Enhanced Task Functions
export const fetchFilteredTasks = async (projectId, filters = {}) => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.assignee) params.assignee = filters.assignee;
    if (filters.search) params.search = filters.search;
    if (filters.sortBy) {
        params.sortBy = filters.sortBy;
        params.order = filters.order || 'desc';
    }

    const res = await api.get(`/tasks/project/${projectId}`, { params });
    return res.data;
};

// Bulk Operations
export const bulkUpdateStatus = async (taskIds, status) => {
    const res = await api.post('/tasks/bulk/status', { taskIds, status });
    return res.data;
};

export const bulkAssign = async (taskIds, assigneeIds) => {
    const res = await api.post('/tasks/bulk/assign', { taskIds, assigneeIds });
    return res.data;
};

export const bulkDelete = async (taskIds) => {
    const res = await api.post('/tasks/bulk/delete', { taskIds });
    return res.data;
};
