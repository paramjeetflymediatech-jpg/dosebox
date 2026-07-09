import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/env';

/**
 * The API file is the central nervous system for all network communications.
 * It intercepts requests to inject the authorization token and handles
 * token refreshing automatically on 401 errors.
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Attach accessToken to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching access token for request interceptor', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Response Interceptor: Handle 401 Unauthorized (Token Refresh Logic)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the server returns 401 Unauthorized, and this is the first retry attempt
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Ask the backend for a new access token
          const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          if (refreshResponse.data && refreshResponse.data.accessToken) {
            const newAccessToken = refreshResponse.data.accessToken;
            await AsyncStorage.setItem('accessToken', newAccessToken);
            
            // Retry the original request with the shiny new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Refresh token expired or invalid', refreshError);
        // Clean up storage so the app knows the user is logged out
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        
        // TODO: You might want to trigger a global event here or use a Navigation reference
        // to forcefully navigate the user back to the Welcome/Login screen.
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
