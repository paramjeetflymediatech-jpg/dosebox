import { PermissionsAndroid, Platform } from 'react-native';
import { AlertService } from './AlertService';

class PermissionsService {
  /**
   * Request Camera and Gallery (Storage) permissions.
   * Required for Prescription Upload and Profile Images.
   */
  static async requestCameraAndGalleryPermission() {
    if (Platform.OS !== 'android') return true; // iOS handles via Info.plist automatically on access usually

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ];

      // Handle Storage permissions based on Android version
      if (Platform.Version >= 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      } else {
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      const storageGranted = Platform.Version >= 33 
        ? granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED
        : (granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
           granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED);

      if (!cameraGranted || !storageGranted) {
        AlertService.show({
          type: 'error',
          title: 'Permission Denied',
          message: 'Camera and Gallery permissions are required to upload prescriptions.'
        });
        return false;
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  /**
   * Request Location permission.
   * Required for Checkout Address Fetching.
   */
  static async requestLocationPermission() {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'DoseBox needs access to your location to automatically fetch your delivery address.',
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
          message: 'Location permission is required to fetch your current address.'
        });
        return false;
      }
    } catch (err) {
      console.warn(err);
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
