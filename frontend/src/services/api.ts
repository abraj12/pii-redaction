import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
const api = axios.create({
    baseURL: apiUrl ? (apiUrl.endsWith('/api') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api`) : 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const anonId = localStorage.getItem('anonymousSessionId');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (anonId) {
        config.headers['x-anonymous-session-id'] = anonId;
    }
    
    return config;
});

export default api;
