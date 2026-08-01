import { getApps } from '@react-native-firebase/app';
import { getMessaging, requestPermission, getToken, onMessage, AuthorizationStatus } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

class PushNotificationService {
  static async requestUserPermission() {
    if (getApps().length === 0) return false;
    try {
      const authStatus = await requestPermission(getMessaging());
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Push notifications permission request skipped:', error?.message || error);
      return false;
    }
  }

  static async getFCMToken() {
    if (getApps().length === 0) return null;
    try {
      const token = await getToken(getMessaging());
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.log('FCM Token skipped:', error?.message || error);
      return null;
    }
  }

  static async setupForegroundHandler() {
    if (getApps().length === 0) return () => {};
    try {
      // Listen for foreground messages
      const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
        console.log('A new FCM message arrived in foreground!', remoteMessage);
        
        // Display a local notification using Notifee
        await PushNotificationService.displayNotification(remoteMessage);
      });

      return unsubscribe;
    } catch (error) {
      console.log('Foreground push handler skipped:', error?.message || error);
      return () => {};
    }
  }

  static async displayNotification(remoteMessage) {
    try {
      // Request permissions for iOS if needed
      await notifee.requestPermission();

      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display the notification
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
        },
      });
    } catch (error) {
      console.log('Display local notification skipped:', error?.message || error);
    }
  }
}

export default PushNotificationService;
