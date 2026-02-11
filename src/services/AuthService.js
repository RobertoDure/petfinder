import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure API URL based on platform and environment
const getApiUrl = () => {
  if (__DEV__) {
    // Development environment
    if (Platform.OS === 'android') {
      // For Android:
      // - Emulator: use 10.0.2.2
      // - Physical device: use your computer's IP address
      
      // You can manually switch between these options:
      // Option 1: Android Emulator
      //return 'http://10.0.2.2:8080/api/v1/auth';
      
      // Option 2: Android Physical Device
      return 'http://192.168.0.139:8080/api/v1/auth';
      
    } else if (Platform.OS === 'ios') {
      // For iOS Physical Device (ALWAYS use IP address, never localhost)
      // iOS development builds cannot access localhost due to App Transport Security
      return 'http://192.168.0.139:8080/api/v1/auth';
      
      // Alternative: iOS Simulator (can use localhost, but IP is more reliable)
      //return 'http://localhost:8080/api/v1/auth';
    }
  }
  // Production environment - replace with your actual API URL
  return 'https://your-production-api.com/api/v1/auth';
};

const API_URL = getApiUrl();

const AuthService = {
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
      });

      if (response.data.accessToken) {
        // Save tokens and user info
        await AsyncStorage.setItem('userToken', response.data.accessToken);
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        
        const userInfoData = {
          id: response.data.userId || response.data.id,
          username: username,
          role: response.data.role,
        };
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfoData));
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        console.log('Login Error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        console.log('Login Network Error:', {
          message: error.message,
          config: error.config
        });
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        console.log('Login Setup Error:', error.message);
        throw error;
      }
    }
  },
  
  register: async (registerData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, registerData);
      
      if (response.data.accessToken) {
        // Save tokens and user info
        await AsyncStorage.setItem('userToken', response.data.accessToken);
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        
        const userInfoData = {
          id: response.data.userId || response.data.id,
          username: registerData.username,
          email: registerData.email,
          fullName: registerData.fullName,
          role: response.data.role,
        };
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfoData));
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        console.log('Register Error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(error.response.data.message || 'Registration failed');
      } else if (error.request) {
        console.log('Register Network Error:', {
          message: error.message,
          config: error.config
        });
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        console.log('Register Setup Error:', error.message);
        throw error;
      }
    }
  },
  
  logout: async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userInfo');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) return null;
      
      const response = await axios.post(`${API_URL}/refresh-token`, {
        token: refreshToken
      });
      
      if (response.data.accessToken) {
        await AsyncStorage.setItem('userToken', response.data.accessToken);
        if (response.data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }
        return response.data.accessToken;
      }
      return null;
    } catch (error) {
      console.log('Token refresh failed', error);
      // If refresh token is expired, logout the user
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userInfo');
      return null;
    }
  },
  
  getUserToken: async () => {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error retrieving user token:', error);
      return null;
    }
  },
  
  getUserInfo: async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error retrieving user info:', error);
      return null;
    }
  },
  
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
};

export default AuthService;
