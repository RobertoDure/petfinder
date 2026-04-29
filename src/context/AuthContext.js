import React, { createContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';
import secureStorage from '../utils/secureStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // isLoading is ONLY for the initial session-restore check.
  // Login/register screens manage their own loading state locally.
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const login = async (username, password) => {
    const response = await AuthService.login(username, password);

    if (response.accessToken) {
      setUserToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setUserInfo({
        id: response.userId || response.id,
        username,
        role: response.role,
      });
    }
    return response;
  };

  const register = async (registerData) => {
    const response = await AuthService.register(registerData);

    if (response.accessToken) {
      setUserToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setUserInfo({
        id: response.userId || response.id,
        username: registerData.username,
        email: registerData.email,
        fullName: registerData.fullName,
        role: response.role,
      });
    }
    return response;
  };

  const logout = async () => {
    await AuthService.logout();
    setUserToken(null);
    setUserInfo(null);
    setRefreshToken(null);
  };

  const refreshAccessToken = async () => {
    try {
      const newToken = await AuthService.refreshToken();
      if (newToken) {
        setUserToken(newToken);
        return newToken;
      }
      return null;
    } catch {
      await logout();
      return null;
    }
  };

  const isLoggedIn = async () => {
    try {
      const [token, userInfoData, refreshTokenValue] = await Promise.all([
        AuthService.getUserToken(),
        AuthService.getUserInfo(),
        secureStorage.getRefreshToken(),
      ]);

      if (userInfoData) setUserInfo(userInfoData);
      if (token) {
        setUserToken(token);
        setRefreshToken(refreshTokenValue);
      }
    } catch {
      // Session restore failed – user stays logged out
    } finally {
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
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
