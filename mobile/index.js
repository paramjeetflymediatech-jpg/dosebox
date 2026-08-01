/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Always register main component first
AppRegistry.registerComponent(appName, () => App);

// Register background messaging handler safely
try {
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });
} catch (error) {
  console.log('Firebase background message handler initialization skipped:', error);
}
