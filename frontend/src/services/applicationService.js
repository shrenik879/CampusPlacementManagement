import api from './api';

export const applyJob = (jobId) => api.post(`/applications/apply/${jobId}`);
export const getMyApplications = () => api.get('/applications/my');
export const getMyApplicationsPaged = (params) => api.get('/applications/my/paged', { params });
export const getApplicants = (jobId) => api.get(`/applications/job/${jobId}`);
export const getApplicantsPaged = (jobId, params) => api.get(`/applications/job/${jobId}/paged`, { params });
export const updateStatus = (applicationId, status) =>
  api.put(`/applications/status/${applicationId}`, null, { params: { status } });

export const uploadResume = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/applications/upload-resume', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadResume = () =>
  api.get('/applications/download-resume', { responseType: 'blob' });

export const downloadApplicantResume = (publicId) =>
  api.get(`/applications/download-resume/admin`, { 
    params: { publicId }, 
    responseType: 'blob' 
  });

export const updateSkills = (skills) =>
  api.put('/applications/skills', { skills });

export const parseResume = () =>
  api.get('/applications/parse-resume');

// ── Rounds ─────────────────────────────────────────────────────────────
export const getRounds = (applicationId) =>
  api.get(`/rounds/application/${applicationId}`);

export const updateRound = (data) =>
  api.post('/rounds/update', data);

export const createRounds = (data) =>
  api.post('/rounds/create', data);
