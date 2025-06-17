import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Network from 'expo-network';
import { AuthContext } from '../context/AuthContext';

// Get your computer's IP address dynamically
const getDeviceIP = async () => {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip;
  } catch (error) {
    console.log('Could not get device IP:', error);
    return null;
  }
};

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
      //return 'http://10.0.2.2:8080/api';
      
      // Option 2: Android Physical Device
      return 'http://192.168.0.139:8080/api';
      
    } else if (Platform.OS === 'ios') {
      // For iOS Physical Device (ALWAYS use IP address, never localhost)
      // iOS development builds cannot access localhost due to App Transport Security
      return 'http://192.168.0.139:8080/api';
      
      // Alternative: iOS Simulator (can use localhost, but IP is more reliable)
      // return 'http://localhost:8080/api';
    }
  }
  // Production environment - replace with your actual API URL
  return 'https://your-production-api.com/api';
};

const BASE_URL = getApiUrl();

// Enhanced logging for debugging network issues
console.log(`🌐 API Configuration:`);
console.log(`📱 Platform: ${Platform.OS}`);
console.log(`🔗 Base URL: ${BASE_URL}`);
console.log(`🛠️ Development Mode: ${__DEV__}`);

// Test network connectivity on app start
const testNetworkConnectivity = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    console.log('📶 Network State:', {
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
      type: networkState.type
    });
    
    // Test if we can reach our server
    const testUrl = `${BASE_URL}/health`; // Add a health endpoint if you have one
    console.log(`🏥 Testing connectivity to: ${testUrl}`);
    
  } catch (error) {
    console.log('❌ Network test failed:', error);
  }
};

// Run connectivity test on startup
testNetworkConnectivity();

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeouts for image uploads
  timeout: 30000, // 30 seconds
});

// Add request interceptor for retry logic
let isRetrying = false;

apiClient.interceptors.response.use(
  response => response,
  async error => {
    // Log detailed error information for debugging
    console.log('🚨 API Error Details:');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔗 URL:', error.config?.url);
    console.log('💬 Message:', error.message);
    console.log('📊 Status:', error.response?.status);
    
    // Only retry once to avoid infinite loops
    if (!isRetrying && (!error.response || error.message.includes('Network Error'))) {
      isRetrying = true;
      console.log('🔄 Network error detected, attempting retry...');
      
      try {
        // Wait a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create a new request
        const retryConfig = error.config;
        // Make sure the retry has a shorter timeout
        retryConfig.timeout = 15000;
        
        // Attempt the request again
        const result = await axios(retryConfig);
        isRetrying = false;
        return result;
      } catch (retryError) {
        isRetrying = false;
        return Promise.reject(retryError);
      }
    }
    
    // If not a network error or already retried, reject normally
    return Promise.reject(error);
  }
);


// Add a request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Add auth token to all requests
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't override Content-Type if it's multipart/form-data
    // This is important for file uploads
    if (config.headers['Content-Type'] === 'multipart/form-data') {
      // For multipart/form-data, let the browser set the boundary automatically
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${BASE_URL}/v1/auth/refresh-token`, {
          token: refreshToken,
        });
        
        if (response.data.accessToken) {
          await AsyncStorage.setItem('userToken', response.data.accessToken);
          if (response.data.refreshToken) {
            await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
          }
          
          // Update the failed request with new token
          originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        
        // If refresh fails, redirect to login
        // This requires access to navigation, which we don't have here
        // We should handle this in the UI components
        
        // Clear tokens
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('userInfo');
      }
    }
    
    // Enhanced error handling for validation errors (400 status codes)
    if (error.response && error.response.status === 400) {
      console.log('Validation error:', error.response.data);
      
      // Add more detailed error information
      error.validationError = true;
      
      // If there's a specific error message in the response, extract it
      if (error.response.data && error.response.data.error) {
        error.validationMessage = error.response.data.error;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
