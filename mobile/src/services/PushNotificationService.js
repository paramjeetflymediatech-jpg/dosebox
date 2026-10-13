import { getApps } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  onMessage,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

class PushNotificationService {
  /**
   * Pre-create Android notification channel with high priority and sound
   */
  static async createDefaultChannel() {
    try {
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Order Updates & Alerts',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      return channelId;
    } catch (error) {
      console.log('Failed to create notification channel:', error?.message || error);
      return 'default';
    }
  }

  /**
   * Comprehensive permission request for Android (including Android 13+ POST_NOTIFICATIONS) and iOS
   */
  static async requestUserPermission() {
    try {
      // 1. Android 13+ (API 33+) explicit runtime notification permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'DoseBox needs notification access to send you live order updates and delivery alerts.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          );
          console.log('[Push] Android POST_NOTIFICATIONS status:', granted);
        } catch (androidErr) {
          console.log('[Push] Android POST_NOTIFICATIONS request skipped:', androidErr);
        }
      }

      // 2. Request Notifee permissions (iOS and Android)
      try {
        await notifee.requestPermission();
      } catch (notifeeErr) {
        console.log('[Push] Notifee requestPermission error:', notifeeErr);
      }

      // 3. Request Firebase Messaging permissions
      try {
        const messagingInstance = getMessaging();
        const authStatus = await requestPermission(messagingInstance);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;
        console.log('[Push] FCM Authorization status:', authStatus, 'enabled:', enabled);
      } catch (fcmErr) {
        console.log('[Push] Firebase requestPermission error:', fcmErr);
      }

      // 4. Ensure notification channel exists
      await this.createDefaultChannel();

      return true;
    } catch (error) {
      console.log('[Push] Permission request error:', error?.message || error);
      return false;
    }
  }

  /**
   * Retrieve active FCM device token
   */
  static async getFCMToken() {
    try {
      const messagingInstance = getMessaging();
      const token = await getToken(messagingInstance);
      console.log('[Push] FCM Token obtained:', token ? `${token.substring(0, 15)}...` : 'null');
      return token;
    } catch (error) {
      console.log('[Push] FCM Token error:', error?.message || error);
      return null;
    }
  }

  /**
   * Listen for token refresh events
   */
  static setupTokenRefresh(callback) {
    try {
      const messagingInstance = getMessaging();
      return onTokenRefresh(messagingInstance, async (newToken) => {
        console.log('[Push] FCM Token refreshed:', newToken ? `${newToken.substring(0, 15)}...` : 'null');
        if (callback && newToken) {
          try {
            await callback(newToken);
          } catch (e) {
            console.log('[Push] Error in token refresh callback:', e);
          }
        }
      });
    } catch (error) {
      console.log('[Push] setupTokenRefresh skipped:', error?.message || error);
      return () => {};
    }
  }

  /**
   * Listen for incoming messages while app is in the foreground
   */
  static async setupForegroundHandler() {
    try {
      await this.createDefaultChannel();
      const messagingInstance = getMessaging();

      const unsubscribe = onMessage(messagingInstance, async (remoteMessage) => {
        console.log('[Push] FCM message arrived in foreground:', remoteMessage);
        await PushNotificationService.displayNotification(remoteMessage);
      });

      return unsubscribe;
    } catch (error) {
      console.log('[Push] Foreground push handler error:', error?.message || error);
      return () => {};
    }
  }

  /**
   * Display local heads-up notification with sound and vibration
   */
  static async displayNotification(remoteMessage) {
    try {
      const channelId = await this.createDefaultChannel();

      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title ||
        'DoseBox Notification';

      const body =
        remoteMessage?.notification?.body ||
        remoteMessage?.data?.body ||
        remoteMessage?.data?.message ||
        '';

      await notifee.displayNotification({
        title,
        body,
        data: remoteMessage?.data || {},
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_launcher',
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.log('[Push] Display local notification error:', error?.message || error);
    }
  }
}

export default PushNotificationService;
