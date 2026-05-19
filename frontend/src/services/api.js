import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 and 429 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    if (err.response?.status === 429) {
      // Let the caller handle it — re-throw so LoginPage can show countdown
      // But also ensure the structured data is accessible
      return Promise.reject(err);
    }
    return Promise.reject(err);
  }
);

export default api;
