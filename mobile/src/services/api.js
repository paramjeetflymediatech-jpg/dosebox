import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertService } from './AlertService';
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
      if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        // Convert empty strings to null recursively
        const cleanData = (obj) => {
          for (let key in obj) {
            if (obj[key] === '') {
              obj[key] = null;
            } else if (obj[key] !== null && typeof obj[key] === 'object') {
              cleanData(obj[key]);
            }
          }
        };
        cleanData(config.data);
      }
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
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    const originalRequest = error.config;
    
    // If the server returns 401 Unauthorized, and this is the first retry attempt
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Ask the backend for a new access token
          const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refreshToken
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
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        
        AlertService.show({
          type: 'error',
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.'
        });
      }
    } else {
      // Global Error Popups for any other error (excluding the 401 which is either retried or handled by specific screens like UploadPrescription)
      if (error.response && error.response.status !== 401) {
        const msg = error.response.data?.message || `Server Error (${error.response.status}). Please try again.`;
        AlertService.show({
          type: 'error',
          title: 'Oops!',
          message: msg
        });
      } else if (!error.response) {
        AlertService.show({
          type: 'error',
          title: 'Network Error',
          message: 'Unable to connect to the server. Please check your internet connection.'
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
