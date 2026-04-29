import apiClient from './apiClient';
import secureStorage from '../utils/secureStorage';

const AuthService = {
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/v1/auth/login', { username, password });

      if (response.data.accessToken) {
        await secureStorage.setToken(response.data.accessToken);
        await secureStorage.setRefreshToken(response.data.refreshToken);
        await secureStorage.setUserInfo({
          id: response.data.userId || response.data.id,
          username,
          role: response.data.role,
        });
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Login failed');
      } else if (error.request) {
        throw new Error(
          'Unable to connect to the server. Please check your internet connection and try again.',
        );
      }
      throw error;
    }
  },

  register: async (registerData) => {
    try {
      const response = await apiClient.post('/v1/auth/register', registerData);

      if (response.data.accessToken) {
        await secureStorage.setToken(response.data.accessToken);
        await secureStorage.setRefreshToken(response.data.refreshToken);
        await secureStorage.setUserInfo({
          id: response.data.userId || response.data.id,
          username: registerData.username,
          email: registerData.email,
          fullName: registerData.fullName,
          role: response.data.role,
        });
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Registration failed');
      } else if (error.request) {
        throw new Error(
          'Unable to connect to the server. Please check your internet connection and try again.',
        );
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      await secureStorage.clearAll();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) return null;

      const response = await apiClient.post('/v1/auth/refresh-token', { token: refreshToken });

      if (response.data.accessToken) {
        await secureStorage.setToken(response.data.accessToken);
        if (response.data.refreshToken) {
          await secureStorage.setRefreshToken(response.data.refreshToken);
        }
        return response.data.accessToken;
      }
      return null;
    } catch (error) {
      await secureStorage.clearAll();
      return null;
    }
  },

  getUserToken: () => secureStorage.getToken(),

  getUserInfo: () => secureStorage.getUserInfo(),

  isAuthenticated: async () => {
    const token = await secureStorage.getToken();
    return !!token;
  },
};

export default AuthService;
