import api from './api';

/** GET /api/dashboard/stats — public, no JWT required */
export const getPortalStats = () => api.get('/dashboard/stats');
