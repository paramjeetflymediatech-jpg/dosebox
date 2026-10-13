import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  let initialized = false;

  // Option 1: Try JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({
        credential: cert(serviceAccount),
      });
      initialized = true;
      console.log('Firebase Admin initialized successfully using service account JSON');
    } catch (err: any) {
      console.warn('Could not initialize Firebase via FIREBASE_SERVICE_ACCOUNT_KEY, trying discrete variables...', err?.message || err);
    }
  }

  // Option 2: Try discrete environment variables
  if (!initialized && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      const formattedKey = process.env.FIREBASE_PRIVATE_KEY
        .replace(/\\n/g, '\n')
        .replace(/^"(.*)"$/, '$1')
        .replace(/^'(.*)'$/, '$1')
        .trim();

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedKey,
        }),
      });
      initialized = true;
      console.log('Firebase Admin initialized successfully using discrete environment variables');
    } catch (err: any) {
      console.warn('Could not initialize Firebase via discrete variables:', err?.message || err);
    }
  }

  if (!initialized) {
    console.warn('Firebase Admin credentials not defined or invalid. Push notifications will be skipped.');
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
