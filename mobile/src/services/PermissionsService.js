import { PermissionsAndroid, Platform } from 'react-native';
import { AlertService } from './AlertService';

class PermissionsService {
  /**
   * Request Camera permission.
   * Required for taking photos with Camera.
   * Note: Photo picking uses Android's native system Photo Picker and does NOT require any storage permission.
   */
  static async requestCameraPermission() {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'DoseBox needs access to your camera to capture prescription and profile photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        AlertService.show({
          type: 'error',
          title: 'Permission Denied',
          message: 'Camera permission is required to capture photos.'
        });
        return false;
      }
    } catch (err) {
      console.warn('Camera permission request error:', err);
      return true;
    }
  }

  /**
   * Legacy alias: Camera only.
   * Note: Photo picking uses Android's native system Photo Picker and does NOT require any storage permissions.
   */
  static async requestCameraAndGalleryPermission() {
    return this.requestCameraPermission();
  }

  /**
   * Request Location permission.
   * Required for Checkout Address Fetching.
   */
  static async requestLocationPermission() {
    if (Platform.OS !== 'android') return true;

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      const fineGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

      if (fineGranted || coarseGranted) {
        return true;
      } else {
        AlertService.show({
          type: 'error',
          title: 'Permission Denied',
          message: 'Location permission is required to fetch your current address.'
        });
        return false;
      }
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }

  /**
   * Request Notification permission (Android 13+).
   * Required for Order updates and Medicine reminders.
   */
  static async requestNotificationPermission() {
    if (Platform.OS !== 'android' || Platform.Version < 33) return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notifications Permission',
          message: 'DoseBox needs permission to send you order updates and reminders.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
}

export default PermissionsService;
