/**
 * Thin wrapper around expo-secure-store.
 * All auth tokens and user info are stored encrypted on device.
 */
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo',
};

const secureStorage = {
  // ── Access token ──────────────────────────────────────────────
  getToken: () => SecureStore.getItemAsync(KEYS.TOKEN),
  setToken: (value) => SecureStore.setItemAsync(KEYS.TOKEN, value),
  removeToken: () => SecureStore.deleteItemAsync(KEYS.TOKEN),

  // ── Refresh token ─────────────────────────────────────────────
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
  setRefreshToken: (value) => SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, value),
  removeRefreshToken: () => SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),

  // ── User info (stored as serialised JSON) ──────────────────────
  getUserInfo: async () => {
    const raw = await SecureStore.getItemAsync(KEYS.USER_INFO);
    return raw ? JSON.parse(raw) : null;
  },
  setUserInfo: (value) =>
    SecureStore.setItemAsync(KEYS.USER_INFO, JSON.stringify(value)),
  removeUserInfo: () => SecureStore.deleteItemAsync(KEYS.USER_INFO),

  // ── Convenience: wipe all auth data (e.g. on logout) ─────────
  clearAll: async () => {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER_INFO);
  },
};

export default secureStorage;
