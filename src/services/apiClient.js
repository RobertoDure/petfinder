import axios from 'axios';
import secureStorage from '../utils/secureStorage';
import { API_BASE_URL } from '../config/env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ── Request interceptor: attach auth token ────────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // For multipart/form-data let axios set the boundary automatically
    if (config.headers['Content-Type'] === 'multipart/form-data') {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: 401 token refresh → network retry → validation ─────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 → attempt silent token refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await secureStorage.getRefreshToken();
        const response = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh-token`,
          { token: refreshToken },
        );
        if (response.data.accessToken) {
          await secureStorage.setToken(response.data.accessToken);
          if (response.data.refreshToken) {
            await secureStorage.setRefreshToken(response.data.refreshToken);
          }
          originalRequest.headers['Authorization'] =
            `Bearer ${response.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        await secureStorage.clearAll();
      }
    }

    // Network error → retry once per request (per-request flag, not module-level)
    if (
      !originalRequest._networkRetry &&
      (!error.response || error.message.includes('Network Error'))
    ) {
      originalRequest._networkRetry = true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      originalRequest.timeout = 15000;
      return axios(originalRequest);
    }

    // 400 validation error enrichment
    if (error.response?.status === 400) {
      error.validationError = true;
      if (error.response.data?.error) {
        error.validationMessage = error.response.data.error;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
