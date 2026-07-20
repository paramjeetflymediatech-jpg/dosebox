import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // If provided as a JSON string in env
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully using service account JSON');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Push notifications will not work.');
      // Initialize with default application credentials if running on GCP
      initializeApp();
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

/**
 * Send a push notification to a specific device via FCM Token
 */
export async function sendPushNotification(token: string, title: string, body: string, data?: any) {
  if (!token) return { success: false, error: 'No token provided' };
  
  try {
    const payload = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    const response = await getMessaging().send(payload);
    console.log('Successfully sent push notification:', response);
    return { success: true, response };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}
