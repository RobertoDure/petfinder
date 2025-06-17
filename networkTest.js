// Network Connection Test for iOS Physical Device
// Save this as: networkTest.js in your project root

import { Platform } from 'react-native';
import * as Network from 'expo-network';

const testNetworkConnection = async () => {
  console.log('=== NETWORK CONNECTION TEST ===');
  console.log(`Platform: ${Platform.OS}`);
  
  try {
    // Test 1: Check network state
    const networkState = await Network.getNetworkStateAsync();
    console.log('📶 Network State:', networkState);
    
    // Test 2: Get device IP
    const deviceIP = await Network.getIpAddressAsync();
    console.log(`📱 Device IP: ${deviceIP}`);
    
    // Test 3: Test different server URLs
    const testUrls = [
      'http://192.168.0.139:8080/api/v1/auth/login',
      'http://localhost:8080/api/v1/auth/login',
      'http://10.0.2.2:8080/api/v1/auth/login'
    ];
    
    for (const url of testUrls) {
      try {
        console.log(`🧪 Testing: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          timeout: 5000,
        });
        
        console.log(`✅ ${url} - Status: ${response.status}`);
        
      } catch (error) {
        console.log(`❌ ${url} - Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Network test failed:', error);
  }
  
  console.log('=== TEST COMPLETE ===');
};

export default testNetworkConnection;

// Usage: Import and call this function in your App.js
// import testNetworkConnection from './networkTest';
// testNetworkConnection();
