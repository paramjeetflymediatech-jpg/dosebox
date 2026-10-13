/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Always register main components for iOS and Android
AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('DoseboxMobile', () => App);

// Register background messaging handler safely for headless tasks
try {
  const messagingInstance = getMessaging();
  setBackgroundMessageHandler(messagingInstance, async (remoteMessage) => {
    console.log('[FCM Background] Message received in background:', remoteMessage);

    // If it's a data-only payload without a standard notification block, display via Notifee
    if (remoteMessage && !remoteMessage.notification) {
      try {
        const PushNotificationService = require('./src/services/PushNotificationService').default;
        await PushNotificationService.displayNotification(remoteMessage);
      } catch (displayErr) {
        console.log('[FCM Background] Error displaying background notification:', displayErr);
      }
    }
  });
} catch (error) {
  console.log('[FCM Background] Handler registration skipped:', error?.message || error);
}
