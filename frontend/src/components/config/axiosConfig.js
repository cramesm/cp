import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Only use localhost in dev mode — Vite tree-shakes this from production builds
  if (import.meta.env.DEV) {
    return `http://localhost:5000/api`;
  }
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