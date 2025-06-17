import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGES_CACHE_PREFIX = 'messages_cache_';
const CONVERSATIONS_CACHE_KEY = 'conversations_cache';

const MessagingService = {
  /**
   * Get all conversations for current user
   * @returns {Promise<Array>} List of conversations
   */
  getConversations: async () => {
    try {
      // Get user info to get the user ID
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const response = await apiClient.get(`/messages/conversations/${userInfo.id}`);
      
      // Cache conversations locally
      await AsyncStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      // Try to get from local cache as fallback
      const cachedConversations = await AsyncStorage.getItem(CONVERSATIONS_CACHE_KEY);
      return cachedConversations ? JSON.parse(cachedConversations) : [];
    }
  },
  
  /**
   * Get messages for a specific conversation
   * @param {string|number} conversationId - ID of the conversation
   * @param {number} page - Page number for pagination
   * @param {number} size - Page size for pagination
   * @returns {Promise<object>} Messages with pagination info
   */
  getMessages: async (conversationId, page = 0, size = 20) => {
    try {
      const response = await apiClient.get(`/messages/conversation/${conversationId}`, {
        params: { page, size }
      });
      
      // Cache messages locally
      const cacheKey = `${MESSAGES_CACHE_PREFIX}${conversationId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      
      // Try to get from local cache as fallback
      const cacheKey = `${MESSAGES_CACHE_PREFIX}${conversationId}`;
      const cachedMessages = await AsyncStorage.getItem(cacheKey);
      return cachedMessages ? JSON.parse(cachedMessages) : { content: [], empty: true };
    }
  },
  
  /**
   * Send a message in a conversation
   * @param {string|number} conversationId - ID of the conversation
   * @param {string} content - Message content
   * @returns {Promise<object>} Sent message
   */
  sendMessage: async (conversationId, content) => {
    try {
      // Get user info to get the user ID
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const messageData = {
        senderId: userInfo.id,
        conversationId,
        content,
      };
      
      const response = await apiClient.post('/messages/send', messageData);
      return response.data;
    } catch (error) {
      console.error(`Error sending message in conversation ${conversationId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new conversation
   * @param {string|number} receiverId - ID of the receiver
   * @param {string} firstMessage - First message to send
   * @returns {Promise<object>} Created conversation with first message
   */
  createConversation: async (receiverId, firstMessage) => {
    try {
      // Get user info to get the user ID
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const conversationData = {
        participants: [userInfo.id, receiverId],
        firstMessage: {
          senderId: userInfo.id,
          content: firstMessage,
        },
      };
      
      const response = await apiClient.post('/messages/conversation', conversationData);
      return response.data;
    } catch (error) {
      console.error(`Error creating conversation with user ${receiverId}:`, error);
      throw error;
    }
  },
  
  /**
   * Mark messages as read
   * @param {string|number} conversationId - ID of the conversation
   * @returns {Promise<object>} Result of operation
   */
  markAsRead: async (conversationId) => {
    try {
      // Get user info to get the user ID
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const response = await apiClient.put(`/messages/read/${conversationId}/${userInfo.id}`);
      return response.data;
    } catch (error) {
      console.error(`Error marking messages as read in conversation ${conversationId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get count of unread messages for current user
   * @returns {Promise<number>} Count of unread messages
   */
  getUnreadCount: async () => {
    try {
      // Get user info to get the user ID
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const response = await apiClient.get(`/messages/unread-count/${userInfo.id}`);
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      return 0;
    }
  },
  
  /**
   * Get a conversation between the current user and another user
   * @param {string|number} otherUserId - ID of the other user
   * @returns {Promise<object|null>} Conversation or null if not found
   */
  getConversationWithUser: async (otherUserId) => {
    try {
      // Get user info to get the user ID
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const response = await apiClient.get(`/messages/conversation-with/${userInfo.id}/${otherUserId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Conversation doesn't exist yet
        return null;
      }
      console.error(`Error fetching conversation with user ${otherUserId}:`, error);
      throw error;
    }
  }
};

export default MessagingService;
