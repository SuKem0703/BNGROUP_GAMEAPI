export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
}

export interface LoginPayload {
  identity: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser | null;
  message?: string;
}
