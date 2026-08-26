import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Validate hostname against allowlist to prevent DOM-based link manipulation (CWE-451)
  const hostname = window.location.hostname;
  const allowedHosts = ['localhost', '127.0.0.1'];
  if (allowedHosts.includes(hostname)) {
    return `http://${hostname}:5000/api`;
  }
  // Production fallback — use relative path (proxied by Vercel)
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
    headers: {
    "ngrok-skip-browser-warning": "true", 
  },
});

API.interceptors.request.use((config) => {
 const token = localStorage.getItem("token");
  
if (token) {
  config.headers.set("Authorization", `Bearer ${token}`);
}
  return config;
});

export default API;