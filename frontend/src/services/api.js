import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const getMe = () => api.get('/auth/me');

export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword });

// Staff
export const getStaff = (params = {}) => api.get('/staff', { params });

export const getStaffById = (id) => api.get(`/staff/${id}`);

export const createStaff = (data) => api.post('/staff', data);

export const updateStaff = (id, data) => api.patch(`/staff/${id}`, data);

export const deleteStaff = (id) => api.delete(`/staff/${id}`);

// Activity
export const getActivity = (params = {}) => api.get('/activity', { params });

export const createActivity = (data) => api.post('/activity', data);

export const updateActivity = (id, data) => api.patch(`/activity/${id}`, data);

export const deleteActivity = (id) => api.delete(`/activity/${id}`);

export const bulkImportActivity = (activities) =>
  api.post('/activity/bulk-import', { activities });

// Strikes
export const getStrikes = (params = {}) => api.get('/strikes', { params });

export const getStaffStrikes = (staffId) => api.get(`/strikes/staff/${staffId}`);

export const createStrike = (data) => api.post('/strikes', data);

export const updateStrike = (id, data) => api.patch(`/strikes/${id}`, data);

export const removeStrike = (id, removalReason) =>
  api.patch(`/strikes/${id}/remove`, { removal_reason: removalReason });

export const getStrikeStats = () => api.get('/strikes/stats');

// Stats
export const getOverviewStats = (params = {}) =>
  api.get('/stats/overview', { params });

export const getRankings = (params = {}) => api.get('/stats/rankings', { params });

export const getTrends = (params = {}) => api.get('/stats/trends', { params });

export const getSeniorComparison = (params = {}) =>
  api.get('/stats/senior-comparison', { params });

export const getStaffSummary = (staffId, params = {}) =>
  api.get(`/stats/staff-summary/${staffId}`, { params });

export const exportData = (params = {}) =>
  api.get('/stats/export', { params, responseType: 'blob' });

export default api;
