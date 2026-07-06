// import axios from 'axios';
// import { API_URL } from './env';

// const api = axios.create({
//   baseURL: API_URL,
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   },
// });

// api.interceptors.request.use(
//   async (config) => {
//     // Auth token logic here if needed
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default api;


import { Platform } from 'react-native';

// Production
// export const API_BASE_URL = "https://workontap.com";
// export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCXYDPiTcgW59JVMY9TnFPxMcOVbRE29_g";

// Development (Uncomment to use local backend)
const DEV_URL = Platform.OS === 'android' ? "http://192.168.1.9" : "http://localhost:3000";
export const API_BASE_URL = DEV_URL;
