import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If in production build, never use localhost even if incorrectly configured in env
  if (import.meta.env.PROD && envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return '/api';
  }
  if (envUrl) {
    return envUrl;
  }
  // Only use localhost in local dev mode
  if (import.meta.env.DEV) {
    return `http://localhost:5000/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
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
