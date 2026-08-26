import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Only use window.location in dev mode — Vite tree-shakes this from production builds
  if (import.meta.env.DEV) {
    return `http://localhost:5000/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add a request interceptor to include the Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
