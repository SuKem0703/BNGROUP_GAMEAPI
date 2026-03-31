import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { normalizeApiError } from '@/utils/normalize';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = normalizeApiError(error);

    if (normalizedError.status === 401) {
      useAuthStore.getState().logout();

      const pathname = window.location.pathname;
      if (!['/login', '/register'].includes(pathname)) {
        window.location.replace('/login');
      }
    }

    return Promise.reject(normalizedError);
  },
);
