/**
 * Centralised API configuration.
 *
 * Dev: set EXPO_PUBLIC_API_HOST in .env (see .env.example).
 * Prod: set EXPO_PUBLIC_API_URL to the full production base URL.
 */

const DEV_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.0.139:8080';
const PROD_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com/api';

export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}/api`
  : PROD_URL;
