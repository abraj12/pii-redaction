import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
