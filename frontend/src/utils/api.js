import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gih_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Default JSON Content-Type breaks multipart uploads (multer never sees the file).
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const h = config.headers;
    if (h && typeof h.delete === 'function') {
      h.delete('Content-Type');
      h.delete('content-type');
    } else if (h) {
      delete h['Content-Type'];
      delete h['content-type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        return Promise.reject(error);
      }
      localStorage.removeItem('gih_token');
      const path = window.location.pathname;
      if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
        // Reject so callers' `await` does not hang forever; redirect on next tick.
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 0);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
