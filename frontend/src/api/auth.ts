import { apiClient } from '@/lib/axios';
import type { LoginPayload, RegisterPayload } from '@/types/auth';
import { normalizeAuthResponse } from '@/utils/normalize';

export async function login(payload: LoginPayload) {
  const response = await apiClient.post('/Accounts/Login', {
    username: payload.identity,
    password: payload.password,
  });

  return normalizeAuthResponse(response.data, payload.identity);
}

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post('/Accounts/Create', {
    username: payload.username,
    email: payload.email,
    password: payload.password,
  });

  return normalizeAuthResponse(response.data, payload.username);
}
