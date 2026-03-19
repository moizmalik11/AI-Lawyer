import api from '../utils/api';

export const dashboardService = {
    /**
     * Fetches the overall statistics for the user.
     * GET /api/dashboard/stats
     */
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    /**
     * Fetches the user's overall experience/rating data.
     * GET /api/dashboard/experience
     */
    getExperience: async () => {
        const response = await api.get('/dashboard/experience');
        return response.data;
    },

    /**
     * Fetches AI model status and system quota limits.
     * GET /api/dashboard/system-status
     */
    getSystemStatus: async () => {
        const response = await api.get('/dashboard/system-status');
        return response.data;
    }
};