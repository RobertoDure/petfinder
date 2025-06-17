import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/AuthService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login(username, password);

      if (response.accessToken) {
        setUserToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        
        // Store user info from the response
        const userInfoData = {
          id: response.userId || response.id,  // Get user ID from response
          username: username,
          role: response.role,                // Get user role from response
        };
        
        setUserInfo(userInfoData);
      }
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };  const register = async (registerData) => {
    try {
      setIsLoading(true);
      const response = await AuthService.register(registerData);
      
      if (response.accessToken) {
        setUserToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        
        const userInfoData = {
          id: response.userId || response.id,
          username: registerData.username,
          email: registerData.email,
          fullName: registerData.fullName,
          role: response.role,
        };
        
        setUserInfo(userInfoData);
      }
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };
  const logout = async () => {
    setIsLoading(true);
    await AuthService.logout();
    setUserToken(null);
    setUserInfo(null);
    setRefreshToken(null);
    setIsLoading(false);
  };

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) return null;
      
      const newToken = await AuthService.refreshToken();
      
      if (newToken) {
        setUserToken(newToken);
        // The refreshToken function in AuthService already updates AsyncStorage
        return newToken;
      }
      return null;
    } catch (error) {
      console.log('Token refresh failed', error);
      // If refresh token is expired, logout the user
      await logout();
      return null;
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const token = await AuthService.getUserToken();
      const userInfoData = await AuthService.getUserInfo();
      const refreshTokenValue = await AsyncStorage.getItem('refreshToken');
      
      if (userInfoData) {
        setUserInfo(userInfoData);
      }
      
      if (token) {
        setUserToken(token);
        setRefreshToken(refreshTokenValue);
      }
      
      setIsLoading(false);
    } catch (e) {
      console.log(`isLoggedIn Error: ${e}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        register,
        refreshAccessToken,
        isLoading,
        userToken,
        userInfo,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
