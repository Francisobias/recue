// src/utils/notificationService.js
import { Platform } from 'react-native';
import { Notifications } from 'react-native-notifications';

// Initialize the notification system (call once when app starts)
export const initializeNotifications = () => {
  if (!Notifications) {
    console.warn('react-native-notifications not available');
    return;
  }

  Notifications.registerRemoteNotifications();

  if (Platform.OS === 'ios') {
    Notifications.ios.registerRemoteNotifications();
    Notifications.ios.requestPermissions({
      alert: true,
      badge: true,
      sound: true,
    });
  }

  // Foreground notification handler
  Notifications.events().registerNotificationReceivedForeground(
    (notification, completion) => {
      console.log('Notification received in foreground:', notification.payload);
      completion({ alert: true, sound: true, badge: false });
    }
  );

  // When user taps notification
  Notifications.events().registerNotificationOpened((notification, completion) => {
    console.log('Notification opened by user:', notification.payload);
    completion();
  });
};

// Main function you will use everywhere
export const sendNotification = (title = 'RescueLink', body = '') => {
  if (!Notifications) {
    console.warn('Notifications module not ready');
    return;
  }

  Notifications.postLocalNotification({
    title,
    body,
    sound: 'default',
    silent: false,
    category: 'RESCUELINK_CATEGORY',
    userInfo: {},
  });
};

// Also keep the old name for backward compatibility (optional)
export const presentLocalNotification = sendNotification;