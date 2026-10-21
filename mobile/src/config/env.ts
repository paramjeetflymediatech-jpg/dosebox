import { Platform } from 'react-native';

// 10.0.2.2 is the Android emulator's alias for the host machine's localhost
const LOCAL_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const PORT = '3000';

export const ENV = {
  DEV_API_URL: `http://${LOCAL_IP}:${PORT}/api`,
  PROD_API_URL: 'https://dosebox.in/api',
  IS_PROD: true,
};

export const API_URL = ENV.IS_PROD ? ENV.PROD_API_URL : ENV.DEV_API_URL;
