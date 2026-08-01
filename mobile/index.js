/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApps } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Always register main components for iOS and Android
AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('DoseboxMobile', () => App);

// Register background messaging handler safely if Firebase is initialized
try {
  if (getApps().length > 0) {
    setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  }
} catch (error) {
  // Silent fallback if Firebase is not yet ready
}
