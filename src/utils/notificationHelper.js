// notificationHelper.js - Notification Utility Functions
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Notification handler reference
let notificationListener = null;
let responseListener = null;

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
      Alert.alert(
        'Thông báo',
        'Vui lòng cấp quyền thông báo trong cài đặt để nhận nhắc nhở',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'SmartNotes Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        description: 'Thông báo nhắc nhở cho ghi chú',
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
        title: `📝 ${note.title}`,
        body: note.content
          ? note.content.substring(0, 100) +
            (note.content.length > 100 ? '...' : '')
          : 'Bạn có việc cần làm',
        data: {
          noteId: note.id,
          type: 'note_reminder',
          timestamp: Date.now(),
        },
        sound: true,
        badge: 1,
      },
      trigger: {
        date: dueDate,
      },
    });

    console.log(
      'Notification scheduled:',
      notificationId,
      'for date:',
      dueDate
    );
    return notificationId;
  } catch (error) {
    console.log('Error scheduling notification:', error);
    Alert.alert('Lỗi', 'Không thể lên lịch thông báo. Vui lòng thử lại.', [
      { text: 'OK' },
    ]);
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
    throw error;
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
    throw error;
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
    console.log('Retrieved notifications:', notifications.length);
    return notifications;
  } catch (error) {
    console.log('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Configure notification handler and listeners
 * @param {Function} onNotificationReceived - Callback when notification received
 * @param {Function} onNotificationTapped - Callback when notification tapped
 */
export const configureNotificationHandler = (
  onNotificationReceived,
  onNotificationTapped
) => {
  try {
    if (!isNotificationsSupported()) {
      console.log(
        'Skipping notification handler configuration (not supported in Expo Go)'
      );
      return;
    }

    // Configure how notifications should be displayed
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log(
          'Notification received:',
          notification.request.content.title
        );

        // Call callback if provided
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });

    // Clean up existing listeners
    if (notificationListener) {
      notificationListener.remove();
    }
    if (responseListener) {
      responseListener.remove();
    }

    // Listen for notifications received while app is in foreground
    notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          'Notification received in foreground:',
          notification.request.content.title
        );
      }
    );

    // Listen for notification taps
    responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log(
          'Notification tapped:',
          response.notification.request.content.title
        );

        // Handle notification tap
        const data = response.notification.request.content.data;
        if (data && onNotificationTapped) {
          onNotificationTapped(data);
        }
      }
    );

    console.log('Notification handler configured');
  } catch (error) {
    console.log('Error configuring notification handler:', error);
  }
};

/**
 * Remove notification listeners
 */
export const removeNotificationListeners = () => {
  try {
    if (notificationListener) {
      notificationListener.remove();
      notificationListener = null;
    }
    if (responseListener) {
      responseListener.remove();
      responseListener = null;
    }
    console.log('Notification listeners removed');
  } catch (error) {
    console.log('Error removing notification listeners:', error);
  }
};

/**
 * Clear notification badge
 */
export const clearNotificationBadge = async () => {
  try {
    if (!isNotificationsSupported()) return;

    await Notifications.setBadgeCountAsync(0);
    console.log('Notification badge cleared');
  } catch (error) {
    console.log('Error clearing notification badge:', error);
  }
};

/**
 * Schedule a test notification (for testing purposes)
 * @param {number} seconds - Number of seconds from now
 */
export const scheduleTestNotification = async (seconds = 5) => {
  try {
    if (!isNotificationsSupported()) {
      Alert.alert(
        'Thông báo',
        'Tính năng thông báo không được hỗ trợ trong Expo Go',
        [{ text: 'OK' }]
      );
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'Thông báo thử nghiệm hoạt động tốt!',
        data: {
          type: 'test',
          timestamp: Date.now(),
        },
        sound: true,
      },
      trigger: {
        seconds: seconds,
      },
    });

    Alert.alert(
      'Thành công',
      `Thông báo thử nghiệm sẽ hiển thị sau ${seconds} giây`,
      [{ text: 'OK' }]
    );

    console.log('Test notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.log('Error scheduling test notification:', error);
    Alert.alert('Lỗi', 'Không thể tạo thông báo thử nghiệm');
    return null;
  }
};
