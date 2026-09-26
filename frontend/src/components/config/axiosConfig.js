import axios from "axios";

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD && envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return '/api';
  }
  if (envUrl) {
    return envUrl;
  }
  // Only use localhost in dev mode
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