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
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Push notifications will be skipped.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin (Check your .env for invalid JSON):', error);
  }
}

/**
 * Send a push notification to a specific device via FCM Token
 */
export async function sendPushNotification(token: string, title: string, body: string, data?: any, userId?: number) {
  if (!getApps().length) {
    console.warn('Skipping push notification because Firebase Admin is not initialized.');
    return { success: false, error: 'Firebase not initialized' };
  }

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
    const isUnregistered = 
      error.code === 'messaging/registration-token-not-registered' || 
      error.errorInfo?.code === 'messaging/registration-token-not-registered' ||
      error.message?.includes('NotRegistered') ||
      error.message?.includes('UNREGISTERED');

    if (isUnregistered) {
      console.warn(`[FCM Push] Device token is no longer registered. Cleaning up stale token...`);
      try {
        const { User, MobileAuthUser } = require('../models');
        if (userId) {
          await User.update({ fcmToken: null }, { where: { id: userId } });
        }
        await User.update({ fcmToken: null }, { where: { fcmToken: token } });
        await MobileAuthUser.update({ pushToken: null }, { where: { pushToken: token } });
      } catch (dbErr) {
        console.error('Failed to cleanup stale FCM token from DB:', dbErr);
      }
      return { success: false, error: 'Token not registered', isUnregistered: true };
    }

    console.error('Error sending push notification:', error.message || error);
    return { success: false, error: error.message || error };
  }
}
