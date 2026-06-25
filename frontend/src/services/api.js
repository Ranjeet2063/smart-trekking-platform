import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );
          useAuthStore.getState().setTokens(data.data);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

export const userAPI = {
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getUserTreks: (id) => api.get(`/users/${id}/treks`),
};

export const emergencyContactAPI = {
  list: () => api.get('/emergency-contacts'),
  create: (data) => api.post('/emergency-contacts', data),
  update: (id, data) => api.put(`/emergency-contacts/${id}`, data),
  remove: (id) => api.delete(`/emergency-contacts/${id}`),
};

export const trekAPI = {
  list: () => api.get('/treks'),
  create: (data) => api.post('/treks', data),
  getById: (id) => api.get(`/treks/${id}`),
  update: (id, data) => api.put(`/treks/${id}`, data),
  delete: (id) => api.delete(`/treks/${id}`),
  start: (id) => api.post(`/treks/${id}/start`),
  complete: (id) => api.post(`/treks/${id}/complete`),
  abort: (id) => api.post(`/treks/${id}/abort`),
};

export const locationAPI = {
  update: (data) => api.post('/locations/update', data),
  getHistory: (trekId, params) => api.get(`/locations/${trekId}`, { params }),
  getLatest: (trekId) => api.get(`/locations/${trekId}/latest`),
  getReplay: (trekId) => api.get(`/locations/${trekId}/replay`),
};

export const sosAPI = {
  trigger: (data) => api.post('/sos/trigger', data),
  listIncidents: () => api.get('/sos/incidents'),
  getIncident: (id) => api.get(`/sos/incidents/${id}`),
  updateStatus: (id, data) => api.put(`/sos/incidents/${id}/status`, data),
  getActive: () => api.get('/sos/active'),
};

export const notificationAPI = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
