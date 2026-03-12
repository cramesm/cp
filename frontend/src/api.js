import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Point to standard Express port
});

export default api;
