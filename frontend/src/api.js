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
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle session expiration on 401 Unauthorized
api.interceptors.response.use(
  (apiResponse) => apiResponse,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/admin-login');
      if (!isAuthAttempt) {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userDepartment');
        if (window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
          window.location.href = '/?sessionExpired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
