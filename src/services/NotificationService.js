import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const NOTIFICATION_TOKEN_KEY = 'push_notification_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationService = {
  /**
   * Register the device for push notifications
   * @returns {Promise<string>} Expo push token
   */
  registerForPushNotifications: async () => {
    try {
      // Check if physical device
      if (!Device.isDevice) {
        console.log('Physical device is required for Push Notifications');
        return null;
      }

      // Check permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      
      // Configure Android notification channel
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Save token to server
      await apiClient.post('/users/notification-token', { token });
      
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  /**
   * Get the stored notification token
   * @returns {Promise<string|null>} The notification token or null
   */
  getNotificationToken: async () => {
    try {
      return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting notification token:', error);
      return null;
    }
  },

  /**
   * Remove the notification token
   * @returns {Promise<boolean>} Success status
   */
  removeNotificationToken: async () => {
    try {
      // Remove from server
      const token = await NotificationService.getNotificationToken();
      if (token) {
        await apiClient.delete('/users/notification-token', { 
          data: { token } 
        });
      }
      
      // Remove from AsyncStorage
      await AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Error removing notification token:', error);
      return false;
    }
  },

  /**
   * Schedule a local notification
   * @param {object} options - Notification options
   * @returns {Promise<string>} Notification ID
   */
  scheduleLocalNotification: async (options) => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title || 'Notification',
          body: options.body || '',
          data: options.data || {},
          sound: true,
        },
        trigger: options.trigger || null,
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  },

  /**
   * Send an immediate local notification
   * @param {object} options - Notification options
   * @returns {Promise<string>} Notification ID
   */
  sendImmediateNotification: async (options) => {
    return NotificationService.scheduleLocalNotification({
      ...options,
      trigger: null,
    });
  },

  /**
   * Cancel a scheduled notification
   * @param {string} notificationId - ID of the notification to cancel
   * @returns {Promise<void>}
   */
  cancelNotification: async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  },

  /**
   * Set up notification listeners
   * @param {Function} onReceive - Function to call when notification is received
   * @param {Function} onResponse - Function to call when user taps on notification
   * @returns {object} Subscription objects that should be cleaned up on component unmount
   */
  setupNotificationListeners: (onReceive, onResponse) => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      onReceive
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      onResponse
    );

    return {
      receivedSubscription,
      responseSubscription,
      removeListeners: () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      },
    };
  },
};

export default NotificationService;
