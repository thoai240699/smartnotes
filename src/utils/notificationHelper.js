// notificationHelper.js - Notification Utility Functions
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Check if notifications are supported
 * @returns {boolean}
 */
export const isNotificationsSupported = () => {
  // Notifications work in development builds but have limitations in Expo Go
  if (isExpoGo) {
    console.log(
      '⚠️ Notifications have limited support in Expo Go. Use development build for full functionality.'
    );
    return false;
  }
  return true;
};

/**
 * Request notification permissions
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermissions = async () => {
  try {
    // Check if notifications are supported
    if (!isNotificationsSupported()) {
      console.log('Notifications not fully supported in current environment');
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }

    return true;
  } catch (error) {
    console.log('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule notification for a note
 * @param {Object} note - Note object with dueDate
 * @returns {Promise<string>} Notification ID
 */
export const scheduleNoteNotification = async (note) => {
  try {
    // Check if notifications are supported
    if (!isNotificationsSupported()) {
      Alert.alert(
        'Thông báo',
        'Tính năng thông báo không được hỗ trợ đầy đủ trong Expo Go. Vui lòng sử dụng development build để có đầy đủ tính năng.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    const dueDate = new Date(note.dueDate);
    const now = new Date();

    // Chỉ schedule nếu dueDate trong tương lai
    if (dueDate <= now) {
      console.log('Due date is in the past, not scheduling notification');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nhắc nhở: ' + note.title,
        body: note.content || 'Bạn có việc cần làm',
        data: { noteId: note.id },
        sound: true,
      },
      trigger: {
        date: dueDate,
      },
    });

    console.log('Notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.log('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel scheduled notification
 * @param {string} notificationId
 */
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Notification cancelled:', notificationId);
  } catch (error) {
    console.log('Error cancelling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.log('Error cancelling all notifications:', error);
  }
};

/**
 * Get all scheduled notifications
 * @returns {Promise<Array>}
 */
export const getAllScheduledNotifications = async () => {
  try {
    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.log('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Configure notification handler
 */
export const configureNotificationHandler = () => {
  try {
    if (isNotificationsSupported()) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      console.log('Notification handler configured');
    } else {
      console.log(
        'Skipping notification handler configuration (not supported in Expo Go)'
      );
    }
  } catch (error) {
    console.log('Error configuring notification handler:', error);
  }
};
