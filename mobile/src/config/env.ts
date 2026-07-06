import { Platform } from 'react-native';

const LOCAL_IP = '192.168.1.100'; 
const PORT = '3000';

export const ENV = {
  DEV_API_URL: `http://${LOCAL_IP}:${PORT}/api`,
  PROD_API_URL: 'https://your-production-url.com/api',
  IS_PROD: false,
};

export const API_URL = ENV.IS_PROD ? ENV.PROD_API_URL : ENV.DEV_API_URL;
