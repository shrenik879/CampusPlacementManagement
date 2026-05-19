import api from './api';

export const getJobs = (params) => api.get('/jobs', { params });
export const postJob = (data) => api.post('/jobs', data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
export const closeJob = (id) => api.put(`/jobs/${id}/close`);
export const getRecommendedJobs = () => api.get('/recommendations');
