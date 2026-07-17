import { getMessaging, requestPermission, getToken, onMessage, AuthorizationStatus } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

class PushNotificationService {
  static async requestUserPermission() {
    const authStatus = await requestPermission(getMessaging());
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      return true;
    }
    return false;
  }

  static async getFCMToken() {
    try {
      const token = await getToken(getMessaging());
      console.log('FCM Token:', token);
      // Here you would typically send the token to your backend
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  static async setupForegroundHandler() {
    // Listen for foreground messages
    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
      console.log('A new FCM message arrived in foreground!', remoteMessage);
      
      // Display a local notification using Notifee
      await PushNotificationService.displayNotification(remoteMessage);
    });

    return unsubscribe;
  }

  static async displayNotification(remoteMessage) {
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
        // pressAction is needed if you want the app to open when pressed
        pressAction: {
          id: 'default',
        },
      },
    });
  }
}

export default PushNotificationService;
