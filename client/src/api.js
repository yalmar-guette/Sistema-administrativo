import axios from 'axios';

// Use production backend URL when deployed, localhost for development
const api = axios.create({
    baseURL: import.meta.env.PROD
        ? 'https://sistema-administrativo-backend.onrender.com/api'
        : 'http://localhost:3000/api'
});

// Add token and inventory_id to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Add current inventory ID for filtering
    const inventoryId = localStorage.getItem('currentInventoryId');
    if (inventoryId) {
        config.headers['x-inventory-id'] = inventoryId;
    }

    return config;
});

export default api;
