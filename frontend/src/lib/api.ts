import axios from 'axios';

// Calculate the base API path. If running locally, check port 5000 or relative proxy path.
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // If we're hitting localhost:3000 in dev, backend is on localhost:5000
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5050/api';
    }
    // Otherwise in docker deployment we reverse proxy via Nginx, so same origin /api is standard
    return '/api';
  }
  return 'http://localhost:5050/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject the JWT accessToken automatically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to catch 401 and try refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Trigger token refresh endpoint
          const res = await axios.post(`${getBaseUrl()}/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data?.accessToken) {
            const newAccessToken = res.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token expired or invalid, log user out
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth_logout'));
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
