import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = rawBaseUrl
  ? (rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach appropriate token (student vs admin)
api.interceptors.request.use((config) => {
  const isAdminRequest = config.url && config.url.includes('/admin');
  const token = isAdminRequest
    ? (localStorage.getItem('admin_token') || localStorage.getItem('token'))
    : (localStorage.getItem('token') || localStorage.getItem('admin_token'));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and auth errors without breaking login error toasts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Do NOT auto-redirect on login/auth verification endpoints so UI can display the error toast
    const authEndpoints = ['/login', '/admin/login', '/register', '/forgot-password', '/verify-otp', '/reset-password'];
    const isAuthEndpoint = authEndpoints.some((endpoint) => url.includes(endpoint));

    if (status === 401 && !isAuthEndpoint) {
      if (url.includes('/admin')) {
        localStorage.removeItem('admin_token');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Student Authentication & Profile
export const login = (data) => api.post('/login', data);
export const register = (data) => api.post('/register', data);
export const logout = () => api.post('/logout');
export const getMe = () => api.get('/me');
export const changePassword = (data) => api.post('/change-password', data);

// Password Reset Flow
export const forgotPassword = (data) => api.post('/forgot-password', data);
export const verifyOtp = (data) => api.post('/verify-otp', data);
export const resetPassword = (data) => api.post('/reset-password', data);

// Search & History
export const search = (query) => api.get(`/search?q=${encodeURIComponent(query)}`);
export const getSearchHistory = () => api.get('/search-history');

// Admin Endpoints
export const adminLogin = (data) => api.post('/admin/login', data);
export const getPendingStudents = () => api.get('/admin/pending-students');
export const approveStudent = (userId) => api.post('/admin/approve-student', { user_id: userId });
export const rejectStudent = (userId) => api.post('/admin/reject-student', { user_id: userId });
export const revokeAccess = (userId) => api.post('/admin/revoke-access', { user_id: userId });
export const restoreAccess = (userId) => api.post('/admin/restore-access', { user_id: userId });
export const deleteStudent = (userId) => api.post('/admin/delete-student', { user_id: userId });
export const getAllStudents = () => api.get('/admin/students');
export const resetDevice = (userId) => api.post('/admin/reset-device', { user_id: userId });
export const getSearchLogs = () => api.get('/admin/search-logs');
export const getStats = () => api.get('/admin/stats');

export default api;