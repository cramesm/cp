import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
});

API.interceptors.request.use((config) => {
 const token = localStorage.getItem("token");
  
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
  return config;
});

export default API;