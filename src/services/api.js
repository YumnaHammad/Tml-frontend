import axios from 'axios';

// Create axios instance with base configuration
const getBaseURL = () => {
  // In development, use relative URL to leverage Vite proxy (avoids CORS)
  // In production, use the full Vercel backend URL
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // Use relative URL - Vite proxy will forward to Vercel backend
    // This avoids CORS issues since request appears to come from same origin
    return '/api';
  }
  
  // Production: Check for environment variable first
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl && !apiUrl.includes('localhost:5000')) {
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  }
  
  // Production fallback - Vercel backend
  return 'https://tml-backend.vercel.app/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
 
});

// Add request logging
api.interceptors.request.use(
  (config) => {
    console.log('Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
